package com.agrocontrol.usuario.infrastructure.config;

import com.agrocontrol.rol.domain.Rol;
import com.agrocontrol.rol.domain.RolRepository;
import com.agrocontrol.usuario.domain.CodificadorPassword;
import com.agrocontrol.usuario.domain.Usuario;
import com.agrocontrol.usuario.domain.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PrimerAdministradorTest {

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final RolRepository roles = mock(RolRepository.class);
    private final CodificadorPassword codificador = mock(CodificadorPassword.class);

    private PrimerAdministrador con(String email, String password) {
        return new PrimerAdministrador(usuarios, roles, codificador, email, password);
    }

    @Test
    void sinVariablesFallaElArranque() {
        when(usuarios.listarTodos()).thenReturn(List.of());

        assertThatThrownBy(() -> con("", "").run(null)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void claveCortaFallaElArranque() {
        when(usuarios.listarTodos()).thenReturn(List.of());

        assertThatThrownBy(() -> con("admin@empresa.test", "1234567").run(null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void conUsuariosNoHaceNada() throws Exception {
        when(usuarios.listarTodos()).thenReturn(List.of(new Usuario(1L, "Ana", "ana@empresa.test", "h", 1L)));

        con("", "").run(null);

        verify(usuarios, never()).guardar(any());
    }

    @Test
    void creaAlAdministradorConCambioObligatorio() throws Exception {
        when(usuarios.listarTodos()).thenReturn(List.of());
        when(roles.listarTodos()).thenReturn(List.of(new Rol(4L, "ADMINISTRADOR", null)));
        when(codificador.codificar("ClaveInicial1")).thenReturn("hash");

        con("admin@empresa.test", "ClaveInicial1").run(null);

        ArgumentCaptor<Usuario> creado = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).guardar(creado.capture());
        assertThat(creado.getValue().getEmail()).isEqualTo("admin@empresa.test");
        assertThat(creado.getValue().getRolId()).isEqualTo(4L);
        assertThat(creado.getValue().getNombreCompleto()).isEqualTo("Administrador");
        assertThat(creado.getValue().isDebeCambiarPassword()).isTrue();
    }
}
