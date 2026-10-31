package com.agrocontrol.labor.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LaborTest {

    private final LocalDate hoy = LocalDate.of(2026, 3, 1);
    private final Labor labor = new Labor(1L, 2L, 3L, "RIEGO", hoy);

    @Test
    void reprogramarSoloSiEstaPlanificadaOAsignada() {
        labor.reprogramar("FUMIGACION", hoy.plusDays(2));
        assertThat(labor.getTipo()).isEqualTo("FUMIGACION");
        labor.marcarAsignada();
        labor.reprogramar("RIEGO", hoy.plusDays(3));
        assertThat(labor.getFechaPlan()).isEqualTo(hoy.plusDays(3));

        labor.iniciar();

        assertThatThrownBy(() -> labor.reprogramar("RIEGO", hoy)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void asignarPasaDePlanificadaAAsignada() {
        labor.marcarAsignada();
        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.ASIGNADA);

        labor.marcarAsignada();
        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.ASIGNADA);

        labor.iniciar();
        labor.marcarAsignada();
        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.EN_CURSO);
    }

    @Test
    void iniciarDesdeAsignada() {
        labor.marcarAsignada();

        labor.iniciar();

        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.EN_CURSO);
    }

    @Test
    void cancelarDesdePlanificadaAsignadaOEnCurso() {
        labor.cancelar("Llovió");
        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.CANCELADA);
        assertThat(labor.getMotivoCancelacion()).isEqualTo("Llovió");

        Labor asignada = new Labor(1L, 2L, 3L, "RIEGO", hoy);
        asignada.marcarAsignada();
        asignada.cancelar("Llovió");
        assertThat(asignada.getEstado()).isEqualTo(EstadoLabor.CANCELADA);

        Labor enCurso = new Labor(1L, 2L, 3L, "RIEGO", hoy);
        enCurso.iniciar();
        enCurso.cancelar("Llovió");
        assertThat(enCurso.getEstado()).isEqualTo(EstadoLabor.CANCELADA);
    }

    @Test
    void noSeCancelaUnaLaborEjecutada() {
        labor.ejecutar(hoy);

        assertThatThrownBy(() -> labor.cancelar("Error")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void cancelarExigeMotivo() {
        assertThatThrownBy(() -> labor.cancelar(" ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reabrirVuelveAEnCursoYLimpiaLaFecha() {
        labor.ejecutar(hoy);

        labor.reabrir();

        assertThat(labor.getEstado()).isEqualTo(EstadoLabor.EN_CURSO);
        assertThat(labor.getFechaEjecucion()).isNull();
    }

    @Test
    void soloSeReabreUnaLaborEjecutada() {
        assertThatThrownBy(labor::reabrir).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void noSeEjecutaUnaLaborCancelada() {
        labor.cancelar("Llovió");

        assertThatThrownBy(() -> labor.ejecutar(hoy)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(labor::iniciar).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void estaPendienteHastaQueTermina() {
        assertThat(labor.estaPendiente()).isTrue();
        labor.marcarAsignada();
        assertThat(labor.estaPendiente()).isTrue();
        labor.iniciar();
        assertThat(labor.estaPendiente()).isTrue();
        labor.ejecutar(hoy);
        assertThat(labor.estaPendiente()).isFalse();
    }
}
