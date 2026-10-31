package com.agrocontrol.campana.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public class CampanaService {

    private static final int MAX_MOTIVO = 200;

    private final CampanaRepository campanaRepository;
    private final ParcelaRepository parcelaRepository;
    private final CultivoRepository cultivoRepository;
    private final LaborRepository laborRepository;

    public CampanaService(CampanaRepository campanaRepository, ParcelaRepository parcelaRepository,
                          CultivoRepository cultivoRepository, LaborRepository laborRepository) {
        this.campanaRepository = campanaRepository;
        this.parcelaRepository = parcelaRepository;
        this.cultivoRepository = cultivoRepository;
        this.laborRepository = laborRepository;
    }

    @Transactional(readOnly = true)
    public List<Campana> listar(Long parcelaId) {
        if (parcelaId == null) {
            return campanaRepository.listarTodas();
        }
        return campanaRepository.listarPorParcela(parcelaId);
    }

    @Transactional(readOnly = true)
    public Campana obtener(Long id) {
        return campanaRepository.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la campaña con id: " + id));
    }

    @Auditable(entidad = "CAMPANA", accion = "CREAR")
    @Transactional
    public Campana crear(Long parcelaId, Long cultivoId, LocalDate fechaInicio) {
        if (parcelaRepository.buscarPorId(parcelaId).isEmpty()) {
            throw new RecursoNoEncontradoException("No existe la parcela con id: " + parcelaId);
        }
        if (!cultivoRepository.existePorId(cultivoId)) {
            throw new RecursoNoEncontradoException("No existe el cultivo con id: " + cultivoId);
        }
        // Regla de negocio: una parcela trabaja una sola campaña a la vez
        if (campanaRepository.existeAbiertaEnParcela(parcelaId)) {
            throw new ConflictoException("La parcela " + parcelaId + " ya tiene una campaña abierta");
        }
        return campanaRepository.guardar(new Campana(null, parcelaId, cultivoId, fechaInicio));
    }

    @Auditable(entidad = "CAMPANA", accion = "INICIAR")
    @Transactional
    public Campana iniciar(Long id) {
        Campana campana = obtener(id);
        campana.iniciar();
        return campanaRepository.guardar(campana);
    }

    @Auditable(entidad = "CAMPANA", accion = "FINALIZAR")
    @Transactional
    public Campana finalizar(Long id, LocalDate fechaFin) {
        Campana campana = obtener(id);
        campana.finalizar(fechaFin);
        cancelarLaboresPendientes(id, "Campaña finalizada");
        return campanaRepository.guardar(campana);
    }

    @Auditable(entidad = "CAMPANA", accion = "EDITAR")
    @Transactional
    public Campana editar(Long id, Long cultivoId, LocalDate fechaInicio) {
        Campana campana = obtener(id);
        if (!cultivoRepository.existePorId(cultivoId)) {
            throw new RecursoNoEncontradoException("No existe el cultivo con id: " + cultivoId);
        }
        campana.editarPlan(cultivoId, fechaInicio);
        return campanaRepository.guardar(campana);
    }

    @Auditable(entidad = "CAMPANA", accion = "CANCELAR")
    @Transactional
    public Campana cancelar(Long id, String motivo) {
        Campana campana = obtener(id);
        campana.cancelar(motivo);
        cancelarLaboresPendientes(id, "Campaña cancelada: " + motivo);
        return campanaRepository.guardar(campana);
    }

    @Auditable(entidad = "CAMPANA", accion = "MARCAR_PERDIDA")
    @Transactional
    public Campana marcarPerdida(Long id, String motivo, LocalDate fechaFin) {
        Campana campana = obtener(id);
        campana.marcarPerdida(motivo, fechaFin);
        cancelarLaboresPendientes(id, "Campaña perdida: " + motivo);
        return campanaRepository.guardar(campana);
    }

    // El motivo no se guarda en la campaña: AuditoriaAspect lo deja en el detalle de REABRIR.
    @Auditable(entidad = "CAMPANA", accion = "REABRIR")
    @Transactional
    public Campana reabrir(Long id, String motivo) {
        Campana campana = obtener(id);
        if (campanaRepository.existeAbiertaEnParcela(campana.getParcelaId())) {
            throw new ConflictoException("La parcela " + campana.getParcelaId() + " ya tiene otra campaña abierta");
        }
        campana.reabrir();
        return campanaRepository.guardar(campana);
    }

    // Abiertas en una campaña cerrada quedarían sin ninguna acción posible.
    private void cancelarLaboresPendientes(Long campanaId, String motivo) {
        String recortado = motivo.length() > MAX_MOTIVO ? motivo.substring(0, MAX_MOTIVO) : motivo;
        laborRepository.listarPorCampana(campanaId).stream()
                .filter(Labor::estaPendiente)
                .forEach(labor -> {
                    labor.cancelar(recortado);
                    laborRepository.guardar(labor);
                });
    }
}
