package com.agrocontrol.incidencia.infrastructure.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidencia_foto", schema = "agrocontrol")
public class FotoIncidenciaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_foto")
    private Long id;

    @Column(name = "id_incidencia", nullable = false)
    private Long incidenciaId;

    @Column(name = "tipo_contenido", nullable = false, length = 20)
    private String tipoContenido;

    @Column(name = "tamano", nullable = false)
    private int tamano;

    @Column(name = "datos", nullable = false, columnDefinition = "bytea")
    private byte[] datos;

    @Column(name = "id_usuario", nullable = false)
    private Long usuarioId;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    protected FotoIncidenciaJpaEntity() {
    }

    public FotoIncidenciaJpaEntity(Long id, Long incidenciaId, String tipoContenido, int tamano, byte[] datos,
                                   Long usuarioId, LocalDateTime fecha) {
        this.id = id;
        this.incidenciaId = incidenciaId;
        this.tipoContenido = tipoContenido;
        this.tamano = tamano;
        this.datos = datos;
        this.usuarioId = usuarioId;
        this.fecha = fecha;
    }

    public Long getId() { return id; }
    public Long getIncidenciaId() { return incidenciaId; }
    public String getTipoContenido() { return tipoContenido; }
    public int getTamano() { return tamano; }
    public byte[] getDatos() { return datos; }
    public Long getUsuarioId() { return usuarioId; }
    public LocalDateTime getFecha() { return fecha; }
}
