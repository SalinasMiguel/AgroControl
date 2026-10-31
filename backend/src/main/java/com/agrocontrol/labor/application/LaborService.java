package com.agrocontrol.labor.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.auth.domain.Roles;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.labor.domain.AsignacionLabor;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.shared.domain.AccesoDenegadoException;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.UsuarioNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public class LaborService {

    private final LaborRepository laborRepository;
    private final CampanaRepository campanaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    public LaborService(LaborRepository laborRepository, CampanaRepository campanaRepository,
                        UsuarioRepository usuarioRepository, RolRepository rolRepository) {
        this.laborRepository = laborRepository;
        this.campanaRepository = campanaRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
    }

    @Transactional(readOnly = true)
    public List<Labor> listar(Long campanaId) {
        if (campanaId == null) {
            return laborRepository.listarTodas();
        }
        return laborRepository.listarPorCampana(campanaId);
    }

    @Transactional(readOnly = true)
    public Labor obtener(Long id) {
        return laborRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la labor con id: " + id));
    }

    @Auditable(entidad = "LABOR", accion = "PLANIFICAR")
    @Transactional
    public Labor planificar(Long campanaId, String tipo, LocalDate fechaPlan) {
        Campana campana = campanaRepository.buscarPorId(campanaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la campaña con id: " + campanaId));
        if (campana.estaCerrada()) {
            throw new ConflictoException("No se pueden planificar labores en una campaña cerrada");
        }
        // La parcela se toma de la campaña: el cliente no puede enviar una parcela distinta
        return laborRepository.guardar(
                new Labor(null, campanaId, campana.getParcelaId(), tipo.trim().toUpperCase(), fechaPlan));
    }

    @Auditable(entidad = "LABOR", accion = "INICIAR")
    @Transactional
    public Labor iniciar(Long id) {
        Labor labor = obtener(id);
        exigirCampanaAbierta(labor, "iniciar");
        labor.iniciar();
        return laborRepository.guardar(labor);
    }

    @Auditable(entidad = "LABOR", accion = "EJECUTAR")
    @Transactional
    public Labor ejecutar(Long id, LocalDate fechaEjecucion) {
        Labor labor = obtener(id);
        exigirCampanaAbierta(labor, "ejecutar");
        labor.ejecutar(fechaEjecucion);
        return laborRepository.guardar(labor);
    }

    @Auditable(entidad = "LABOR", accion = "EDITAR")
    @Transactional
    public Labor editar(Long id, String tipo, LocalDate fechaPlan) {
        Labor labor = obtener(id);
        exigirCampanaAbierta(labor, "editar");
        labor.reprogramar(tipo.trim().toUpperCase(), fechaPlan);
        return laborRepository.guardar(labor);
    }

    @Auditable(entidad = "LABOR", accion = "CANCELAR")
    @Transactional
    public Labor cancelar(Long id, String motivo) {
        Labor labor = obtener(id);
        exigirCampanaAbierta(labor, "cancelar");
        labor.cancelar(motivo);
        return laborRepository.guardar(labor);
    }

    // El motivo no se guarda en la labor: AuditoriaAspect lo deja en el detalle de REABRIR.
    @Auditable(entidad = "LABOR", accion = "REABRIR")
    @Transactional
    public Labor reabrir(Long id, String motivo) {
        Labor labor = obtener(id);
        exigirCampanaAbierta(labor, "reabrir");
        labor.reabrir();
        return laborRepository.guardar(labor);
    }

    // RN-05: el operario solo ve y reporta las labores que tiene asignadas
    @Transactional(readOnly = true)
    public List<Labor> listarAsignadas(Long usuarioId, Long campanaId) {
        return laborRepository.listarAsignadasA(usuarioId).stream()
                .filter(labor -> campanaId == null || labor.getCampanaId().equals(campanaId))
                .toList();
    }

    @Transactional(readOnly = true)
    public void verificarAsignacion(Long laborId, Long usuarioId) {
        obtener(laborId);
        if (!laborRepository.estaAsignada(laborId, usuarioId)) {
            throw new AccesoDenegadoException("La labor " + laborId + " no está asignada a usted");
        }
    }

    // RF-05: el jefe de campo asigna operarios activos a una labor que aún no se ejecutó
    @Auditable(entidad = "ASIGNACION_LABOR", accion = "ASIGNAR")
    @Transactional
    public AsignacionLabor asignar(Long laborId, Long usuarioId) {
        Labor labor = obtener(laborId);
        if (!labor.estaPendiente()) {
            throw new ConflictoException("La labor ya terminó o fue cancelada: no se le asignan operarios");
        }
        Usuario usuario = usuarioRepository.buscarPorId(usuarioId)
                .orElseThrow(() -> new UsuarioNoEncontradoException(usuarioId));
        String rol = rolRepository.buscarPorId(usuario.getRolId()).map(Rol::getNombre).orElse("");
        if (!Roles.OPERARIO.equals(rol)) {
            throw new ConflictoException("Solo se pueden asignar usuarios con rol OPERARIO");
        }
        if (!usuario.isActivo()) {
            throw new ConflictoException("El operario " + usuario.getNombreCompleto() + " está inactivo");
        }
        if (laborRepository.estaAsignada(laborId, usuarioId)) {
            throw new ConflictoException("El operario ya está asignado a esta labor");
        }
        labor.marcarAsignada();
        laborRepository.guardar(labor);
        return laborRepository.asignar(new AsignacionLabor(null, laborId, usuarioId));
    }

    @Transactional(readOnly = true)
    public List<AsignacionLabor> listarAsignaciones() {
        return laborRepository.listarAsignaciones();
    }

    private void exigirCampanaAbierta(Labor labor, String accion) {
        if (campanaDe(labor).estaCerrada()) {
            throw new ConflictoException("No se puede " + accion + " una labor de una campaña cerrada");
        }
    }

    private Campana campanaDe(Labor labor) {
        return campanaRepository.buscarPorId(labor.getCampanaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la campaña con id: " + labor.getCampanaId()));
    }
}
