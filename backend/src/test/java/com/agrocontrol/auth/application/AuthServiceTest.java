package com.agrocontrol.auth.application;

import com.agrocontrol.auth.application.command.CambiarPasswordCommand;
import com.agrocontrol.auth.domain.GeneradorToken;
import com.agrocontrol.auth.domain.exception.CredencialesInvalidasException;
import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private RolRepository rolRepository;
    @Mock
    private CodificadorPassword codificadorPassword;
    @Mock
    private GeneradorToken generadorToken;

    @InjectMocks
    private AuthService service;

    private Usuario usuario(boolean activo) {
        Usuario usuario = new Usuario(3L, "Luis Choque", "operario1@agrocontrol.com", "hash", 2L, activo, LocalDateTime.now());
        when(usuarioRepository.buscarPorEmail("operario1@agrocontrol.com")).thenReturn(Optional.of(usuario));
        return usuario;
    }

    @Test
    void loginCorrectoDevuelveTokenYRol() {
        Usuario usuario = usuario(true);
        when(codificadorPassword.coincide("agro123", "hash")).thenReturn(true);
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(new Rol(2L, "OPERARIO", null)));
        when(generadorToken.generar(usuario, "OPERARIO")).thenReturn("jwt");

        Sesion sesion = service.iniciarSesion(" operario1@agrocontrol.com ", "agro123");

        assertThat(sesion.token()).isEqualTo("jwt");
        assertThat(sesion.rol()).isEqualTo("OPERARIO");
    }

    @Test
    void contrasenaIncorrectaYEmailInexistenteDanElMismoError() {
        usuario(true);
        when(codificadorPassword.coincide("mala", "hash")).thenReturn(false);
        when(usuarioRepository.buscarPorEmail("nadie@agrocontrol.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.iniciarSesion("operario1@agrocontrol.com", "mala"))
                .isInstanceOf(CredencialesInvalidasException.class)
                .hasMessage("Email o contraseña incorrectos");
        assertThatThrownBy(() -> service.iniciarSesion("nadie@agrocontrol.com", "agro123"))
                .isInstanceOf(CredencialesInvalidasException.class)
                .hasMessage("Email o contraseña incorrectos");
    }

    @Test
    void usuarioInactivoNoEntra() {
        usuario(false);
        when(codificadorPassword.coincide("agro123", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.iniciarSesion("operario1@agrocontrol.com", "agro123"))
                .isInstanceOf(CredencialesInvalidasException.class);
    }

    private Usuario usuarioConClave() {
        Usuario usuario = new Usuario(3L, "Luis Choque", "operario1@agrocontrol.com", "hash", 2L, true, LocalDateTime.now());
        when(usuarioRepository.buscarPorId(3L)).thenReturn(Optional.of(usuario));
        return usuario;
    }

    @Test
    void cambiarPasswordExigeLaClaveActual() {
        usuarioConClave();
        when(codificadorPassword.coincide("mal", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.cambiarPassword(3L, new CambiarPasswordCommand("mal", "ClaveNueva2")))
                .isInstanceOf(IllegalArgumentException.class);

        verify(usuarioRepository, never()).guardar(any());
    }

    @Test
    void cambiarPasswordRechazaLaMismaClave() {
        usuarioConClave();
        when(codificadorPassword.coincide("ClaveActual1", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.cambiarPassword(3L, new CambiarPasswordCommand("ClaveActual1", "ClaveActual1")))
                .isInstanceOf(IllegalArgumentException.class);

        verify(usuarioRepository, never()).guardar(any());
    }

    @Test
    void cambiarPasswordDevuelveSesionNueva() {
        Usuario usuario = usuarioConClave();
        when(codificadorPassword.coincide("ClaveActual1", "hash")).thenReturn(true);
        when(codificadorPassword.codificar("ClaveNueva2")).thenReturn("hash2");
        when(usuarioRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(new Rol(2L, "OPERARIO", null)));
        when(generadorToken.generar(usuario, "OPERARIO")).thenReturn("jwt-nuevo");

        Sesion sesion = service.cambiarPassword(3L, new CambiarPasswordCommand("ClaveActual1", "ClaveNueva2"));

        assertThat(sesion.token()).isEqualTo("jwt-nuevo");
        assertThat(sesion.usuario().getPasswordHash()).isEqualTo("hash2");
        assertThat(sesion.usuario().getTokenVersion()).isEqualTo(1);
    }
}
