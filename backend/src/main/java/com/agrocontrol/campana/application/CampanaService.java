package com.agrocontrol.campana.application;

import com.agrocontrol.auditoria.application.Auditable;
import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.CampanaRepository;
import com.agrocontrol.campana.domain.PlanSiembra;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.cultivo.domain.CultivoRepository;
import com.agrocontrol.labor.domain.Labor;
import com.agrocontrol.labor.domain.LaborRepository;
import com.agrocontrol.parcela.domain.EstadoParcela;
import com.agrocontrol.parcela.domain.Parcela;
import com.agrocontrol.parcela.domain.ParcelaRepository;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.shared.domain.RecursoNoEncontradoException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    public Campana crear(Long parcelaId, Long cultivoId, LocalDate fechaInicio, PlanSiembra plan) {
        verificarSuperficie(parcelaId, plan);
        if (!cultivoRepository.existePorId(cultivoId)) {
            throw new RecursoNoEncontradoException("No existe el cultivo con id: " + cultivoId);
        }
        // Regla de negocio: una parcela trabaja una sola campaña a la vez
        if (campanaRepository.existeAbiertaEnParcela(parcelaId)) {
            throw new ConflictoException("La parcela " + parcelaId + " ya tiene una campaña abierta");
        }
        Campana campana = new Campana(null, parcelaId, cultivoId, fechaInicio);
        campana.definirSiembra(plan);
        return campanaRepository.guardar(campana);
    }

    // No se puede sembrar más de lo que mide la parcela (si tiene el área cargada)
    private void verificarSuperficie(Long parcelaId, PlanSiembra plan) {
        Parcela parcela = parcelaRepository.buscarPorId(parcelaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la parcela con id: " + parcelaId));
        BigDecimal area = parcela.getAreaHa();
        if (plan.areaSembradaHa() != null && area != null && plan.areaSembradaHa().compareTo(area) > 0) {
            throw new IllegalArgumentException(
                    "La superficie sembrada no puede superar las " + area.toPlainString() + " ha de la parcela");
        }
    }

    @Auditable(entidad = "CAMPANA", accion = "INICIAR")
    @Transactional
    public Campana iniciar(Long id) {
        Campana campana = obtener(id);
        Parcela parcela = parcelaSinDescanso(campana);
        campana.iniciar();
        ocupar(parcela);
        return campanaRepository.guardar(campana);
    }

    @Auditable(entidad = "CAMPANA", accion = "FINALIZAR")
    @Transactional
    public Campana finalizar(Long id, LocalDate fechaFin) {
        Campana campana = obtener(id);
        campana.finalizar(fechaFin);
        cancelarLaboresPendientes(id, "Campaña finalizada");
        liberarParcela(campana);
        return campanaRepository.guardar(campana);
    }

    @Auditable(entidad = "CAMPANA", accion = "EDITAR")
    @Transactional
    public Campana editar(Long id, Long cultivoId, LocalDate fechaInicio, PlanSiembra plan) {
        Campana campana = obtener(id);
        verificarSuperficie(campana.getParcelaId(), plan);
        if (!cultivoRepository.existePorId(cultivoId)) {
            throw new RecursoNoEncontradoException("No existe el cultivo con id: " + cultivoId);
        }
        campana.corregir(cultivoId, fechaInicio, plan);
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
        liberarParcela(campana);
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
        Parcela parcela = parcelaSinDescanso(campana);
        campana.reabrir();
        ocupar(parcela);
        return campanaRepository.guardar(campana);
    }

    // El estado de la parcela lo mueve la campaña: en descanso, el suelo no admite una siembra.
    private Parcela parcelaSinDescanso(Campana campana) {
        Parcela parcela = parcelaDe(campana);
        if (parcela.getEstado() == EstadoParcela.EN_DESCANSO) {
            throw new ConflictoException("La parcela " + parcela.getCodigo() + " está en descanso");
        }
        return parcela;
    }

    private void ocupar(Parcela parcela) {
        parcela.cambiarEstado(EstadoParcela.EN_PRODUCCION);
        parcelaRepository.guardar(parcela);
    }

    private void liberarParcela(Campana campana) {
        Parcela parcela = parcelaDe(campana);
        parcela.cambiarEstado(EstadoParcela.DISPONIBLE);
        parcelaRepository.guardar(parcela);
    }

    private Parcela parcelaDe(Campana campana) {
        return parcelaRepository.buscarPorId(campana.getParcelaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la parcela con id: " + campana.getParcelaId()));
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
