package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.insumo.domain.CategoriaInsumo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "insumo", schema = "agrocontrol")
public class InsumoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_insumo")
    private Long id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida;

    @Column(name = "stock_actual", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockActual;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 20)
    private CategoriaInsumo categoria;

    @Column(name = "stock_minimo", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockMinimo;

    @Column(name = "codigo", length = 40)
    private String codigo;

    @Column(name = "marca", length = 60)
    private String marca;

    protected InsumoJpaEntity() {
    }

    public InsumoJpaEntity(Long id, String nombre, String unidadMedida, BigDecimal stockActual,
                           CategoriaInsumo categoria, BigDecimal stockMinimo, String codigo, String marca) {
        this.id = id;
        this.nombre = nombre;
        this.unidadMedida = unidadMedida;
        this.stockActual = stockActual;
        this.categoria = categoria;
        this.stockMinimo = stockMinimo;
        this.codigo = codigo;
        this.marca = marca;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getUnidadMedida() { return unidadMedida; }
    public BigDecimal getStockActual() { return stockActual; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public BigDecimal getStockMinimo() { return stockMinimo; }
    public String getCodigo() { return codigo; }
    public String getMarca() { return marca; }
}
