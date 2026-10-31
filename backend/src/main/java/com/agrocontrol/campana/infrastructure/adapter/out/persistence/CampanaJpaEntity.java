package com.agrocontrol.campana.infrastructure.adapter.out.persistence;

import com.agrocontrol.campana.domain.EstadoCampana;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "campana", schema = "agrocontrol")
public class CampanaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_campana")
    private Long id;

    @Column(name = "id_parcela", nullable = false)
    private Long parcelaId;

    @Column(name = "id_cultivo", nullable = false)
    private Long cultivoId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoCampana estado;

    @Column(name = "motivo_cierre", length = 200)
    private String motivoCierre;

    protected CampanaJpaEntity() {
    }

    public CampanaJpaEntity(Long id, Long parcelaId, Long cultivoId, LocalDate fechaInicio, LocalDate fechaFin,
                            EstadoCampana estado, String motivoCierre) {
        this.id = id;
        this.parcelaId = parcelaId;
        this.cultivoId = cultivoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = estado;
        this.motivoCierre = motivoCierre;
    }

    public Long getId() { return id; }
    public Long getParcelaId() { return parcelaId; }
    public Long getCultivoId() { return cultivoId; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public EstadoCampana getEstado() { return estado; }
    public String getMotivoCierre() { return motivoCierre; }
}
