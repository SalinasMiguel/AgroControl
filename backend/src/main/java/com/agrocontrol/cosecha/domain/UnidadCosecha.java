package com.agrocontrol.cosecha.domain;

import java.math.BigDecimal;
import java.util.Arrays;

// RN-07: toda cantidad cosechada tiene unidad explícita, y los totales se comparan en toneladas.
public enum UnidadCosecha {
    T("t", "1"),
    KG("kg", "0.001"),
    // Quintal boliviano: 46 kg (ver ADR-003)
    QQ("qq", "0.046");

    private final String codigo;
    private final BigDecimal toneladas;

    UnidadCosecha(String codigo, String toneladas) {
        this.codigo = codigo;
        this.toneladas = new BigDecimal(toneladas);
    }

    public static UnidadCosecha desde(String codigo) {
        return Arrays.stream(values())
                .filter(unidad -> unidad.codigo.equals(codigo))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unidad de cosecha no admitida: " + codigo));
    }

    public BigDecimal aToneladas(BigDecimal cantidad) {
        return cantidad.multiply(toneladas);
    }
}
