package com.agrocontrol.cosecha.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CosechaTest {

    private final Cosecha cosecha = new Cosecha(1L, 2L, BigDecimal.TEN, "t", 3L);

    @Test
    void anularGuardaQuienYPorQue() {
        cosecha.anular("Cantidad mal cargada", 7L);

        assertThat(cosecha.isAnulado()).isTrue();
        assertThat(cosecha.getAnulacion().motivo()).isEqualTo("Cantidad mal cargada");
        assertThat(cosecha.getAnulacion().usuarioId()).isEqualTo(7L);
        assertThat(cosecha.getAnulacion().fecha()).isNotNull();
    }

    @Test
    void anularDosVecesEsConflicto() {
        cosecha.anular("Error", 7L);

        assertThatThrownBy(() -> cosecha.anular("Otra vez", 7L)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void anularExigeMotivo() {
        assertThatThrownBy(() -> cosecha.anular(" ", 7L)).isInstanceOf(IllegalArgumentException.class);
    }
}
