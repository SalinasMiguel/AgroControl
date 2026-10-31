package com.agrocontrol.incidencia.infrastructure.adapter.out.persistence;

import com.agrocontrol.incidencia.domain.EstadoIncidencia;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidencia", schema = "agrocontrol")
public class IncidenciaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_incidencia")
    private Long id;

    @Column(name = "id_parcela")
    private Long parcelaId;

    @Column(name = "id_campana")
    private Long campanaId;

    @Column(name = "id_labor")
    private Long laborId;

    @Column(name = "descripcion", nullable = false, columnDefinition = "text")
    private String descripcion;

    @Column(name = "id_usuario", nullable = false)
    private Long usuarioId;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoIncidencia estado;

    @Column(name = "resolucion", columnDefinition = "text")
    private String resolucion;

    @Column(name = "resuelta_en")
    private LocalDateTime resueltaEn;

    @Column(name = "motivo_anulacion", length = 200)
    private String motivoAnulacion;

    @Column(name = "anulado_por")
    private Long anuladoPor;

    @Column(name = "anulado_en")
    private LocalDateTime anuladoEn;

    protected IncidenciaJpaEntity() {
    }

    public IncidenciaJpaEntity(Long id, Long parcelaId, Long campanaId, Long laborId, String descripcion,
                               Long usuarioId, LocalDateTime fecha, EstadoIncidencia estado, String resolucion,
                               LocalDateTime resueltaEn, String motivoAnulacion, Long anuladoPor,
                               LocalDateTime anuladoEn) {
        this.id = id;
        this.parcelaId = parcelaId;
        this.campanaId = campanaId;
        this.laborId = laborId;
        this.descripcion = descripcion;
        this.usuarioId = usuarioId;
        this.fecha = fecha;
        this.estado = estado;
        this.resolucion = resolucion;
        this.resueltaEn = resueltaEn;
        this.motivoAnulacion = motivoAnulacion;
        this.anuladoPor = anuladoPor;
        this.anuladoEn = anuladoEn;
    }

    public Long getId() { return id; }
    public Long getParcelaId() { return parcelaId; }
    public Long getCampanaId() { return campanaId; }
    public Long getLaborId() { return laborId; }
    public String getDescripcion() { return descripcion; }
    public Long getUsuarioId() { return usuarioId; }
    public LocalDateTime getFecha() { return fecha; }
    public EstadoIncidencia getEstado() { return estado; }
    public String getResolucion() { return resolucion; }
    public LocalDateTime getResueltaEn() { return resueltaEn; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public Long getAnuladoPor() { return anuladoPor; }
    public LocalDateTime getAnuladoEn() { return anuladoEn; }
}
