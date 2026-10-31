package com.agrocontrol.labor.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Labor {

    private Long id;
    private Long campanaId;
    private Long parcelaId;
    private String tipo;
    private LocalDate fechaPlan;
    private LocalDate fechaEjecucion;
    private EstadoLabor estado;
    private LocalDateTime creadoEn = LocalDateTime.now();
    private String motivoCancelacion;

    private Labor() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static Labor reconstruir(Long id, Long campanaId, Long parcelaId, String tipo, LocalDate fechaPlan,
                                    LocalDate fechaEjecucion, EstadoLabor estado, LocalDateTime creadoEn,
                                    String motivoCancelacion) {
        Labor l = new Labor();
        l.id = id;
        l.campanaId = campanaId;
        l.parcelaId = parcelaId;
        l.tipo = tipo;
        l.fechaPlan = fechaPlan;
        l.fechaEjecucion = fechaEjecucion;
        l.estado = estado;
        l.creadoEn = creadoEn;
        l.motivoCancelacion = motivoCancelacion;
        return l;
    }

    public Labor(Long id, Long campanaId, Long parcelaId, String tipo, LocalDate fechaPlan) {
        if (campanaId == null) {
            throw new IllegalArgumentException("La labor debe estar asociada a una campaña");
        }
        if (parcelaId == null) {
            throw new IllegalArgumentException("La labor debe estar asociada a una parcela");
        }
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException("El tipo de labor no puede estar vacío");
        }
        if (fechaPlan == null) {
            throw new IllegalArgumentException("La fecha planificada es obligatoria");
        }
        this.id = id;
        this.campanaId = campanaId;
        this.parcelaId = parcelaId;
        this.tipo = tipo;
        this.fechaPlan = fechaPlan;
        this.estado = EstadoLabor.PLANIFICADA;
    }

    // Corrige el plan mientras nadie empezó el trabajo
    public void reprogramar(String tipo, LocalDate fechaPlan) {
        if (estado != EstadoLabor.PLANIFICADA && estado != EstadoLabor.ASIGNADA) {
            throw new IllegalStateException("Solo se corrige una labor que no empezó (estado actual: " + estado + ")");
        }
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException("El tipo de labor no puede estar vacío");
        }
        if (fechaPlan == null) {
            throw new IllegalArgumentException("La fecha planificada es obligatoria");
        }
        this.tipo = tipo;
        this.fechaPlan = fechaPlan;
    }

    // RN-03: tener operario la pasa a ASIGNADA; reasignar una labor ya avanzada no la hace retroceder
    public void marcarAsignada() {
        if (estado == EstadoLabor.PLANIFICADA) {
            this.estado = EstadoLabor.ASIGNADA;
        }
    }

    // El operario empezó el trabajo en el campo (paso opcional: también se puede ejecutar directo)
    public void iniciar() {
        if (estado != EstadoLabor.PLANIFICADA && estado != EstadoLabor.ASIGNADA) {
            throw new IllegalStateException("Solo se inicia una labor que no empezó (estado actual: " + estado + ")");
        }
        this.estado = EstadoLabor.EN_CURSO;
    }

    public void ejecutar(LocalDate fechaEjecucion) {
        if (estado == EstadoLabor.EJECUTADA) {
            throw new IllegalStateException("La labor ya fue ejecutada");
        }
        if (estado == EstadoLabor.CANCELADA) {
            throw new IllegalStateException("La labor está cancelada");
        }
        if (fechaEjecucion == null) {
            throw new IllegalArgumentException("La fecha de ejecución es obligatoria");
        }
        this.fechaEjecucion = fechaEjecucion;
        this.estado = EstadoLabor.EJECUTADA;
    }

    public void cancelar(String motivo) {
        if (!estaPendiente()) {
            throw new IllegalStateException("Solo se cancela una labor pendiente (estado actual: " + estado + ")");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo es obligatorio");
        }
        this.motivoCancelacion = motivo;
        this.estado = EstadoLabor.CANCELADA;
    }

    // La fecha anterior queda en la auditoría de EJECUTAR
    public void reabrir() {
        if (estado != EstadoLabor.EJECUTADA) {
            throw new IllegalStateException("Solo se reabre una labor ejecutada (estado actual: " + estado + ")");
        }
        this.fechaEjecucion = null;
        this.estado = EstadoLabor.EN_CURSO;
    }

    public boolean estaPendiente() {
        return estado == EstadoLabor.PLANIFICADA || estado == EstadoLabor.ASIGNADA || estado == EstadoLabor.EN_CURSO;
    }

    public boolean estaCancelada() {
        return estado == EstadoLabor.CANCELADA;
    }

    public Long getId() { return id; }
    public Long getCampanaId() { return campanaId; }
    public Long getParcelaId() { return parcelaId; }
    public String getTipo() { return tipo; }
    public LocalDate getFechaPlan() { return fechaPlan; }
    public LocalDate getFechaEjecucion() { return fechaEjecucion; }
    public EstadoLabor getEstado() { return estado; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public String getMotivoCancelacion() { return motivoCancelacion; }
}
