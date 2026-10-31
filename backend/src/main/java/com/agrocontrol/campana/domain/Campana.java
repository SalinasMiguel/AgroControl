package com.agrocontrol.campana.domain;

import java.time.LocalDate;

public class Campana {

    private Long id;
    private Long parcelaId;
    private Long cultivoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private EstadoCampana estado;

    private Campana() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static Campana reconstruir(Long id, Long parcelaId, Long cultivoId, LocalDate fechaInicio,
                                      LocalDate fechaFin, EstadoCampana estado) {
        Campana c = new Campana();
        c.id = id;
        c.parcelaId = parcelaId;
        c.cultivoId = cultivoId;
        c.fechaInicio = fechaInicio;
        c.fechaFin = fechaFin;
        c.estado = estado;
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
        if (estaCerrada()) {
            throw new IllegalStateException("La campaña ya está cerrada");
        }
        if (fechaFin == null) {
            throw new IllegalArgumentException("La fecha de fin es obligatoria para finalizar la campaña");
        }
        if (fechaFin.isBefore(fechaInicio)) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
        this.fechaFin = fechaFin;
        this.estado = EstadoCampana.FINALIZADA;
    }

    public Long getId() { return id; }
    public Long getParcelaId() { return parcelaId; }
    public Long getCultivoId() { return cultivoId; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public EstadoCampana getEstado() { return estado; }
}
