package com.agrocontrol.cultivo.infrastructure.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "cultivo", schema = "agrocontrol")
public class CultivoJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cultivo")
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 80)
    private String nombre;

    @Column(name = "ciclo_dias")
    private Integer cicloDias;

    @Column(name = "humedad_estandar_pct", precision = 5, scale = 2)
    private BigDecimal humedadEstandarPct;

    protected CultivoJpaEntity() {
    }

    public CultivoJpaEntity(Long id, String nombre, Integer cicloDias, BigDecimal humedadEstandarPct) {
        this.id = id;
        this.nombre = nombre;
        this.cicloDias = cicloDias;
        this.humedadEstandarPct = humedadEstandarPct;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public Integer getCicloDias() { return cicloDias; }
    public BigDecimal getHumedadEstandarPct() { return humedadEstandarPct; }
}
