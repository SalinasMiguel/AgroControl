package com.agrocontrol.cosecha.infrastructure.adapter.out.persistence;

import com.agrocontrol.shared.persistence.AnulacionEmbeddable;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cosecha", schema = "agrocontrol")
public class CosechaJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cosecha")
    private Long id;

    @Column(name = "id_campana", nullable = false)
    private Long campanaId;

    @Column(name = "cantidad", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDate fecha;

    @Column(name = "id_usuario", nullable = false)
    private Long usuarioId;

    @Embedded
    private AnulacionEmbeddable anulacion;

    @Column(name = "humedad_pct", precision = 5, scale = 2)
    private BigDecimal humedadPct;

    @Column(name = "impurezas_pct", precision = 5, scale = 2)
    private BigDecimal impurezasPct;

    @Column(name = "numero_boleta", length = 30)
    private String numeroBoleta;

    protected CosechaJpaEntity() {
    }

    public CosechaJpaEntity(Long id, Long campanaId, BigDecimal cantidad, String unidadMedida, LocalDate fecha,
                            Long usuarioId, AnulacionEmbeddable anulacion, BigDecimal humedadPct, BigDecimal impurezasPct,
                            String numeroBoleta) {
        this.id = id;
        this.campanaId = campanaId;
        this.cantidad = cantidad;
        this.unidadMedida = unidadMedida;
        this.fecha = fecha;
        this.usuarioId = usuarioId;
        this.anulacion = anulacion;
        this.humedadPct = humedadPct;
        this.impurezasPct = impurezasPct;
        this.numeroBoleta = numeroBoleta;
    }

    public Long getId() { return id; }
    public BigDecimal getHumedadPct() { return humedadPct; }
    public BigDecimal getImpurezasPct() { return impurezasPct; }
    public String getNumeroBoleta() { return numeroBoleta; }
    public Long getCampanaId() { return campanaId; }
    public BigDecimal getCantidad() { return cantidad; }
    public String getUnidadMedida() { return unidadMedida; }
    public LocalDate getFecha() { return fecha; }
    public Long getUsuarioId() { return usuarioId; }
    public AnulacionEmbeddable getAnulacion() { return anulacion; }
}
