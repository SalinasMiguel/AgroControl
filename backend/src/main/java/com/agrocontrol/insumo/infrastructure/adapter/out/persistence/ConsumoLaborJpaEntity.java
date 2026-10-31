package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.shared.persistence.AnulacionEmbeddable;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "consumo_labor", schema = "agrocontrol")
public class ConsumoLaborJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consumo")
    private Long id;

    @Column(name = "id_labor", nullable = false)
    private Long laborId;

    @Column(name = "id_insumo", nullable = false)
    private Long insumoId;

    @Column(name = "cantidad", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    @Embedded
    private AnulacionEmbeddable anulacion;

    protected ConsumoLaborJpaEntity() {
    }

    public ConsumoLaborJpaEntity(Long id, Long laborId, Long insumoId, BigDecimal cantidad, LocalDateTime fecha,
                                 AnulacionEmbeddable anulacion) {
        this.id = id;
        this.laborId = laborId;
        this.insumoId = insumoId;
        this.cantidad = cantidad;
        this.fecha = fecha;
        this.anulacion = anulacion;
    }

    public Long getId() { return id; }
    public Long getLaborId() { return laborId; }
    public Long getInsumoId() { return insumoId; }
    public BigDecimal getCantidad() { return cantidad; }
    public LocalDateTime getFecha() { return fecha; }
    public AnulacionEmbeddable getAnulacion() { return anulacion; }
}
