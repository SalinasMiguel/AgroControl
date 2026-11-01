package com.agrocontrol.cosecha.domain;

import java.math.BigDecimal;

// Lo que dice la boleta de balanza de una carga; todo opcional.
public record CalidadCosecha(BigDecimal humedadPct, BigDecimal impurezasPct, String numeroBoleta) {

    public static final CalidadCosecha VACIA = new CalidadCosecha(null, null, null);
    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    public CalidadCosecha {
        validarPorcentaje(humedadPct, "La humedad");
        validarPorcentaje(impurezasPct, "Las impurezas");
        numeroBoleta = numeroBoleta == null || numeroBoleta.isBlank() ? null : numeroBoleta.trim();
    }

    private static void validarPorcentaje(BigDecimal valor, String nombre) {
        if (valor != null && (valor.signum() < 0 || valor.compareTo(CIEN) > 0)) {
            throw new IllegalArgumentException(nombre + " debe estar entre 0 y 100 %");
        }
    }
}
