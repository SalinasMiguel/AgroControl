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

    private Campana enCurso() {
        Campana campana = new Campana(null, 1L, 2L, inicio);
        campana.iniciar();
        return campana;
    }

    @Test
    void finalizarSoloDesdeEnCurso() {
        Campana planificada = new Campana(null, 1L, 2L, inicio);

        assertThatThrownBy(() -> planificada.finalizar(inicio.plusDays(1))).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void editarPlanSoloSiEstaPlanificada() {
        Campana planificada = new Campana(null, 1L, 2L, inicio);
        planificada.editarPlan(3L, inicio.plusDays(5));
        assertThat(planificada.getCultivoId()).isEqualTo(3L);
        assertThat(planificada.getFechaInicio()).isEqualTo(inicio.plusDays(5));

        assertThatThrownBy(() -> enCurso().editarPlan(3L, inicio)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void cancelarSoloSiEstaPlanificada() {
        Campana planificada = new Campana(null, 1L, 2L, inicio);
        planificada.cancelar("Sin semilla");
        assertThat(planificada.getEstado()).isEqualTo(EstadoCampana.CANCELADA);
        assertThat(planificada.getMotivoCierre()).isEqualTo("Sin semilla");

        assertThatThrownBy(() -> enCurso().cancelar("Sin semilla")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void cancelarExigeMotivo() {
        assertThatThrownBy(() -> new Campana(null, 1L, 2L, inicio).cancelar(" "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void marcarPerdidaSoloDesdeEnCurso() {
        Campana campana = enCurso();
        campana.marcarPerdida("Granizo", inicio.plusDays(30));
        assertThat(campana.getEstado()).isEqualTo(EstadoCampana.PERDIDA);
        assertThat(campana.getFechaFin()).isEqualTo(inicio.plusDays(30));

        assertThatThrownBy(() -> new Campana(null, 1L, 2L, inicio).marcarPerdida("Granizo", inicio))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> enCurso().marcarPerdida("Granizo", inicio.minusDays(1)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reabrirDesdeFinalizadaOPerdida() {
        Campana finalizada = enCurso();
        finalizada.finalizar(inicio.plusDays(90));
        finalizada.reabrir();
        assertThat(finalizada.getEstado()).isEqualTo(EstadoCampana.EN_CURSO);
        assertThat(finalizada.getFechaFin()).isNull();

        Campana perdida = enCurso();
        perdida.marcarPerdida("Granizo", inicio.plusDays(30));
        perdida.reabrir();
        assertThat(perdida.getEstado()).isEqualTo(EstadoCampana.EN_CURSO);
        assertThat(perdida.getMotivoCierre()).isNull();
    }

    @Test
    void noSeReabreUnaCancelada() {
        Campana cancelada = new Campana(null, 1L, 2L, inicio);
        cancelada.cancelar("Sin semilla");

        assertThatThrownBy(cancelada::reabrir).isInstanceOf(IllegalStateException.class);
    }
}
