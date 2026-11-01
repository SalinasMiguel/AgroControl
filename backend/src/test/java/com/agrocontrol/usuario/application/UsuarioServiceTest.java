package com.agrocontrol.usuario.application;

import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.rol.domain.exception.RolNoEncontradoException;
import com.agrocontrol.shared.domain.ConflictoException;
import com.agrocontrol.usuario.application.command.ActualizarUsuarioCommand;
import com.agrocontrol.usuario.application.command.RegistrarUsuarioCommand;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import com.agrocontrol.usuario.domain.exception.EmailUsuarioDuplicadoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private RolRepository rolRepository;
    @Mock
    private CodificadorPassword codificadorPassword;

    @InjectMocks
    private UsuarioService service;

    private final RegistrarUsuarioCommand comando =
            new RegistrarUsuarioCommand(2L, "Ana Vaca", "ana@agrocontrol.com", "clave-segura");

    @Test
    void guardaLaContrasenaCodificada() {
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(new Rol(2L, "OPERARIO", null)));
        when(usuarioRepository.existePorEmail("ana@agrocontrol.com")).thenReturn(false);
        when(codificadorPassword.codificar("clave-segura")).thenReturn("$2a$10$hash");
        when(usuarioRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Usuario usuario = service.registrar(comando);

        assertThat(usuario.getPasswordHash()).isEqualTo("$2a$10$hash");
    }

    @Test
    void rolInexistenteLanza404() {
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.registrar(comando)).isInstanceOf(RolNoEncontradoException.class);
    }

    @Test
    void emailRepetidoLanza409() {
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(new Rol(2L, "OPERARIO", null)));
        when(usuarioRepository.existePorEmail("ana@agrocontrol.com")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(comando)).isInstanceOf(EmailUsuarioDuplicadoException.class);
        verify(usuarioRepository, never()).guardar(any());
    }

    private static final Rol ADMIN = new Rol(1L, "ADMINISTRADOR", null);
    private static final Rol OPERARIO = new Rol(2L, "OPERARIO", null);

    private Usuario existente(Long id, Long rolId) {
        Usuario usuario = new Usuario(id, "Ana Vaca", "ana@agrocontrol.com", "hash", rolId);
        when(usuarioRepository.buscarPorId(id)).thenReturn(Optional.of(usuario));
        return usuario;
    }

    @Test
    void actualizarConSuMismoEmailNoEsDuplicado() {
        existente(5L, 2L);
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(OPERARIO));
        when(usuarioRepository.existeEmailEnOtroUsuario("ANA@agrocontrol.com", 5L)).thenReturn(false);
        when(usuarioRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        Usuario actualizado = service.actualizar(5L, new ActualizarUsuarioCommand(2L, "Ana V.", "ANA@agrocontrol.com"));

        assertThat(actualizado.getEmail()).isEqualTo("ANA@agrocontrol.com");
    }

    @Test
    void actualizarConEmailDeOtroEsDuplicado() {
        existente(5L, 2L);
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(OPERARIO));
        when(usuarioRepository.existeEmailEnOtroUsuario("otro@agrocontrol.com", 5L)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizar(5L, new ActualizarUsuarioCommand(2L, "Ana", "otro@agrocontrol.com")))
                .isInstanceOf(EmailUsuarioDuplicadoException.class);
        verify(usuarioRepository, never()).guardar(any());
    }

    @Test
    void actualizarConRolInexistenteDa404() {
        existente(5L, 2L);
        when(rolRepository.buscarPorId(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizar(5L, new ActualizarUsuarioCommand(9L, "Ana", "ana@agrocontrol.com")))
                .isInstanceOf(RolNoEncontradoException.class);
    }

    @Test
    void noPuedeDesactivarseASiMismo() {
        assertThatThrownBy(() -> service.desactivar(5L, 5L)).isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).guardar(any());
    }

    @Test
    void noSeDesactivaAlUltimoAdministrador() {
        existente(5L, 1L);
        when(rolRepository.buscarPorId(1L)).thenReturn(Optional.of(ADMIN));
        when(usuarioRepository.contarAdministradoresActivos()).thenReturn(1L);

        assertThatThrownBy(() -> service.desactivar(5L, 7L)).isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).guardar(any());
    }

    @Test
    void seDesactivaAUnAdministradorSiQuedaOtro() {
        Usuario usuario = existente(5L, 1L);
        when(rolRepository.buscarPorId(1L)).thenReturn(Optional.of(ADMIN));
        when(usuarioRepository.contarAdministradoresActivos()).thenReturn(2L);
        when(usuarioRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        service.desactivar(5L, 7L);

        assertThat(usuario.isActivo()).isFalse();
    }

    @Test
    void noSeLeQuitaElRolAlUltimoAdministrador() {
        existente(5L, 1L);
        when(rolRepository.buscarPorId(1L)).thenReturn(Optional.of(ADMIN));
        when(rolRepository.buscarPorId(2L)).thenReturn(Optional.of(OPERARIO));
        when(usuarioRepository.contarAdministradoresActivos()).thenReturn(1L);

        assertThatThrownBy(() -> service.actualizar(5L, new ActualizarUsuarioCommand(2L, "Ana", "ana@agrocontrol.com")))
                .isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).guardar(any());
    }

    @Test
    void restablecerGeneraDoceCaracteresYObligaACambiar() {
        Usuario usuario = existente(5L, 2L);
        when(codificadorPassword.codificar(any())).thenReturn("hash-temporal");
        when(usuarioRepository.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        ClaveTemporal temporal = service.restablecerPassword(5L);

        assertThat(temporal.password()).hasSize(12);
        verify(codificadorPassword).codificar(temporal.password());
        assertThat(usuario.getPasswordHash()).isEqualTo("hash-temporal");
        assertThat(usuario.isDebeCambiarPassword()).isTrue();
        assertThat(usuario.getTokenVersion()).isEqualTo(1);
    }
}
