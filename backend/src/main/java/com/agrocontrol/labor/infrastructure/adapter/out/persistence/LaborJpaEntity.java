package com.agrocontrol.labor.infrastructure.adapter.out.persistence;

import com.agrocontrol.labor.domain.EstadoLabor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "labor", schema = "agrocontrol")
public class LaborJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_labor")
    private Long id;

    @Column(name = "id_campana", nullable = false)
    private Long campanaId;

    @Column(name = "id_parcela", nullable = false)
    private Long parcelaId;

    @Column(name = "tipo", nullable = false, length = 60)
    private String tipo;

    @Column(name = "fecha_plan", nullable = false)
    private LocalDate fechaPlan;

    @Column(name = "fecha_ejecucion")
    private LocalDate fechaEjecucion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoLabor estado;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "motivo_cancelacion", length = 200)
    private String motivoCancelacion;

    protected LaborJpaEntity() {
    }

    public LaborJpaEntity(Long id, Long campanaId, Long parcelaId, String tipo, LocalDate fechaPlan,
                          LocalDate fechaEjecucion, EstadoLabor estado, LocalDateTime creadoEn,
                          String motivoCancelacion) {
        this.id = id;
        this.campanaId = campanaId;
        this.parcelaId = parcelaId;
        this.tipo = tipo;
        this.fechaPlan = fechaPlan;
        this.fechaEjecucion = fechaEjecucion;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.motivoCancelacion = motivoCancelacion;
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
