package com.agrocontrol.cultivo.domain;

import java.math.BigDecimal;

public class Cultivo {

    private Long id;
    private String nombre;
    private Integer cicloDias;
    private BigDecimal humedadEstandarPct;

    private Cultivo() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static Cultivo reconstruir(Long id, String nombre, Integer cicloDias) {
        Cultivo c = new Cultivo();
        c.id = id;
        c.nombre = nombre;
        c.cicloDias = cicloDias;
        return c;
    }

    public static Cultivo reconstruir(Long id, String nombre, Integer cicloDias, BigDecimal humedadEstandarPct) {
        Cultivo c = reconstruir(id, nombre, cicloDias);
        c.humedadEstandarPct = humedadEstandarPct;
        return c;
    }

    public Cultivo(Long id, String nombre, Integer cicloDias) {
        validar(nombre, cicloDias);
        this.id = id;
        this.nombre = nombre;
        this.cicloDias = cicloDias;
    }

    public void actualizar(String nombre, Integer cicloDias) {
        validar(nombre, cicloDias);
        this.nombre = nombre;
        this.cicloDias = cicloDias;
    }

    // A esta humedad se paga el grano; sin dato el rendimiento no se ajusta por humedad
    public void definirHumedadEstandar(BigDecimal humedadPct) {
        if (humedadPct != null && (humedadPct.signum() < 0 || humedadPct.compareTo(BigDecimal.valueOf(100)) >= 0)) {
            throw new IllegalArgumentException("La humedad estándar debe estar entre 0 y 100 %");
        }
        this.humedadEstandarPct = humedadPct;
    }

    private static void validar(String nombre, Integer cicloDias) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre del cultivo no puede estar vacío");
        }
        if (cicloDias != null && cicloDias <= 0) {
            throw new IllegalArgumentException("El ciclo del cultivo debe ser mayor que cero");
        }
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public Integer getCicloDias() { return cicloDias; }
    public BigDecimal getHumedadEstandarPct() { return humedadEstandarPct; }
}
