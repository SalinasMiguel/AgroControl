package com.agrocontrol.usuario.domain;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository {
    Usuario guardar(Usuario usuario);
    Optional<Usuario> buscarPorId(Long id);
    Optional<Usuario> buscarPorEmail(String email);
    List<Usuario> listarTodos();
    boolean existePorEmail(String email);
    boolean existeEmailEnOtroUsuario(String email, Long idExcluido);
    long contarAdministradoresActivos();
}
