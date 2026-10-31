package com.agrocontrol.campana.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CampanaTest {

    private final LocalDate inicio = LocalDate.of(2026, 3, 1);

    @Test
    void cicloPlanificadaEnCursoFinalizada() {
        Campana campana = new Campana(null, 1L, 2L, inicio);
        assertThat(campana.getEstado()).isEqualTo(EstadoCampana.PLANIFICADA);

        campana.iniciar();
        assertThat(campana.getEstado()).isEqualTo(EstadoCampana.EN_CURSO);

        campana.finalizar(inicio.plusMonths(4));
        assertThat(campana.estaCerrada()).isTrue();
    }

    @Test
    void noSePuedeIniciarDosVeces() {
        Campana campana = new Campana(null, 1L, 2L, inicio);
        campana.iniciar();

        assertThatThrownBy(campana::iniciar).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void exigeParcelaCultivoYFecha() {
        assertThatThrownBy(() -> new Campana(null, null, 2L, inicio)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Campana(null, 1L, null, inicio)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Campana(null, 1L, 2L, null)).isInstanceOf(IllegalArgumentException.class);
    }
}
