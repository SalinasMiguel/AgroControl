package com.agrocontrol.cosecha.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UnidadCosechaTest {

    @Test
    void convierteCadaUnidad() {
        assertThat(UnidadCosecha.desde("t").aToneladas(new BigDecimal("2"))).isEqualByComparingTo("2");
        assertThat(UnidadCosecha.desde("kg").aToneladas(new BigDecimal("1500"))).isEqualByComparingTo("1.5");
        assertThat(UnidadCosecha.desde("qq").aToneladas(new BigDecimal("100"))).isEqualByComparingTo("4.6");
    }

    @Test
    void rechazaOtraUnidad() {
        assertThatThrownBy(() -> UnidadCosecha.desde("arroba")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void unaCosechaConOtraUnidadNoSeCrea() {
        assertThatThrownBy(() -> new Cosecha(null, 1L, BigDecimal.TEN, "arroba", 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void laCosechaDaSusToneladas() {
        assertThat(new Cosecha(null, 1L, new BigDecimal("100"), "qq", 1L).getToneladas()).isEqualByComparingTo("4.6");
    }
}
