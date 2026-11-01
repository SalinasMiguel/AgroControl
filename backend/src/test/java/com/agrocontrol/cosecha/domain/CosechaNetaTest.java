package com.agrocontrol.cosecha.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CosechaNetaTest {

    private static Cosecha carga(String humedad, String impurezas) {
        Cosecha c = new Cosecha(null, 1L, new BigDecimal("10"), "t", 1L);
        c.registrarCalidad(new CalidadCosecha(humedad == null ? null : new BigDecimal(humedad),
                impurezas == null ? null : new BigDecimal(impurezas), null));
        return c;
    }

    @Test
    void sinDatosDeCalidadQuedaIgual() {
        assertThat(carga(null, null).getToneladasNetas(new BigDecimal("13"))).isEqualByComparingTo("10");
    }

    @Test
    void descuentaElAguaDeMasRespectoDelEstandar() {
        // 10 t al 20 % → 10 × 80 / 87
        assertThat(carga("20", null).getToneladasNetas(new BigDecimal("13"))).isEqualByComparingTo("9.195402");
    }

    @Test
    void masSecaQueElEstandarNoSuma() {
        assertThat(carga("10", null).getToneladasNetas(new BigDecimal("13"))).isEqualByComparingTo("10");
    }

    @Test
    void sinEstandarSoloDescuentaImpurezas() {
        assertThat(carga("20", "2").getToneladasNetas(null)).isEqualByComparingTo("9.8");
    }
}
