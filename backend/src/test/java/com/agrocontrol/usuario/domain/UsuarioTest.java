package com.agrocontrol.usuario.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UsuarioTest {

    private final Usuario usuario = new Usuario(1L, "Ana Vaca", "ana@agrocontrol.com", "h0", 2L);

    @Test
    void cambiarPasswordLimpiaLaObligacionYSubeLaVersion() {
        usuario.restablecerPassword("h1");
        assertThat(usuario.isDebeCambiarPassword()).isTrue();
        assertThat(usuario.getTokenVersion()).isEqualTo(1);

        usuario.cambiarPassword("h2");

        assertThat(usuario.isDebeCambiarPassword()).isFalse();
        assertThat(usuario.getTokenVersion()).isEqualTo(2);
        assertThat(usuario.getPasswordHash()).isEqualTo("h2");
    }

    @Test
    void actualizarDatosSubeLaVersionSoloSiCambiaElRol() {
        usuario.actualizarDatos("Ana V.", "ana.v@agrocontrol.com", 2L);
        assertThat(usuario.getTokenVersion()).isZero();
        assertThat(usuario.getNombreCompleto()).isEqualTo("Ana V.");
        assertThat(usuario.getEmail()).isEqualTo("ana.v@agrocontrol.com");

        usuario.actualizarDatos("Ana V.", "ana.v@agrocontrol.com", 3L);
        assertThat(usuario.getTokenVersion()).isEqualTo(1);
        assertThat(usuario.getRolId()).isEqualTo(3L);
    }

    @Test
    void actualizarDatosValidaComoElConstructor() {
        assertThatThrownBy(() -> usuario.actualizarDatos(" ", "ana@agrocontrol.com", 2L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> usuario.actualizarDatos("Ana", "sin-arroba", 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void exigirCambioPasswordActivaLaObligacion() {
        usuario.exigirCambioPassword();
        assertThat(usuario.isDebeCambiarPassword()).isTrue();
    }
}
