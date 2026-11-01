package com.agrocontrol.campana.domain;

import java.time.LocalDate;

public class Campana {

    private Long id;
    private Long parcelaId;
    private Long cultivoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private EstadoCampana estado;
    private String motivoCierre;

    private Campana() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static Campana reconstruir(Long id, Long parcelaId, Long cultivoId, LocalDate fechaInicio,
                                      LocalDate fechaFin, EstadoCampana estado, String motivoCierre) {
        Campana c = new Campana();
        c.id = id;
        c.parcelaId = parcelaId;
        c.cultivoId = cultivoId;
        c.fechaInicio = fechaInicio;
        c.fechaFin = fechaFin;
        c.estado = estado;
        c.motivoCierre = motivoCierre;
        return c;
    }

    public Campana(Long id, Long parcelaId, Long cultivoId, LocalDate fechaInicio) {
        if (parcelaId == null) {
            throw new IllegalArgumentException("La campaña debe estar asociada a una parcela");
        }
        if (cultivoId == null) {
            throw new IllegalArgumentException("La campaña debe estar asociada a un cultivo");
        }
        if (fechaInicio == null) {
            throw new IllegalArgumentException("La fecha de inicio es obligatoria");
        }
        this.id = id;
        this.parcelaId = parcelaId;
        this.cultivoId = cultivoId;
        this.fechaInicio = fechaInicio;
        this.estado = EstadoCampana.PLANIFICADA;
    }

    public void iniciar() {
        if (estado != EstadoCampana.PLANIFICADA) {
            throw new IllegalStateException("Solo se puede iniciar una campaña PLANIFICADA (estado actual: " + estado + ")");
        }
        this.estado = EstadoCampana.EN_CURSO;
    }

    // Una campaña cerrada ya no admite labores, consumos ni bitácora.
    public boolean estaCerrada() {
        return estado == EstadoCampana.FINALIZADA || estado == EstadoCampana.CANCELADA || estado == EstadoCampana.PERDIDA;
    }

    public void finalizar(LocalDate fechaFin) {
        exigirEnCurso("finalizar");
        validarFechaFin(fechaFin);
        this.fechaFin = fechaFin;
        this.estado = EstadoCampana.FINALIZADA;
    }

    public void editarPlan(Long cultivoId, LocalDate fechaInicio) {
        exigirPlanificada("corregir");
        if (cultivoId == null) {
            throw new IllegalArgumentException("La campaña debe estar asociada a un cultivo");
        }
        if (fechaInicio == null) {
            throw new IllegalArgumentException("La fecha de inicio es obligatoria");
        }
        this.cultivoId = cultivoId;
        this.fechaInicio = fechaInicio;
    }

    // Una campaña que aún no empezó no deja historia: se cancela en vez de finalizarla.
    public void cancelar(String motivo) {
        exigirPlanificada("cancelar");
        validarMotivo(motivo);
        this.motivoCierre = motivo;
        this.estado = EstadoCampana.CANCELADA;
    }

    public void marcarPerdida(String motivo, LocalDate fechaFin) {
        exigirEnCurso("marcar como perdida");
        validarMotivo(motivo);
        validarFechaFin(fechaFin);
        this.motivoCierre = motivo;
        this.fechaFin = fechaFin;
        this.estado = EstadoCampana.PERDIDA;
    }

    // La fecha y el motivo del cierre quedan en la auditoría de FINALIZAR o MARCAR_PERDIDA.
    public void reabrir() {
        if (estado != EstadoCampana.FINALIZADA && estado != EstadoCampana.PERDIDA) {
            throw new IllegalStateException("Solo se reabre una campaña finalizada o perdida (estado actual: " + estado + ")");
        }
        this.fechaFin = null;
        this.motivoCierre = null;
        this.estado = EstadoCampana.EN_CURSO;
    }

    private void exigirPlanificada(String accion) {
        if (estado != EstadoCampana.PLANIFICADA) {
            throw new IllegalStateException("Solo se puede " + accion + " una campaña PLANIFICADA (estado actual: " + estado + ")");
        }
    }

    private void exigirEnCurso(String accion) {
        if (estado != EstadoCampana.EN_CURSO) {
            throw new IllegalStateException("Solo se puede " + accion + " una campaña EN_CURSO (estado actual: " + estado + ")");
        }
    }

    private static void validarMotivo(String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo es obligatorio");
        }
    }

    private void validarFechaFin(LocalDate fechaFin) {
        if (fechaFin == null) {
            throw new IllegalArgumentException("La fecha de fin es obligatoria para cerrar la campaña");
        }
        if (fechaFin.isBefore(fechaInicio)) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
    }

    public Long getId() { return id; }
    public Long getParcelaId() { return parcelaId; }
    public Long getCultivoId() { return cultivoId; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public EstadoCampana getEstado() { return estado; }
    public String getMotivoCierre() { return motivoCierre; }
}
