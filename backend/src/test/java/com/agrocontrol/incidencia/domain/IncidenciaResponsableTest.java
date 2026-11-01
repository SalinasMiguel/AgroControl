package com.agrocontrol.incidencia.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IncidenciaResponsableTest {

    private final Incidencia incidencia = new Incidencia(1L, 2L, null, null, "Plaga", 5L);

    @Test
    void asignaResponsableMientrasEstaAbierta() {
        incidencia.asignarResponsable(7L);
        assertThat(incidencia.getResponsableId()).isEqualTo(7L);
    }

    @Test
    void cerradaNoCambiaDeResponsable() {
        incidencia.resolver("Listo");
        assertThatThrownBy(() -> incidencia.asignarResponsable(7L)).isInstanceOf(IllegalStateException.class);
    }
}
