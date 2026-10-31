package com.agrocontrol.usuario.infrastructure.adapter.in.web.dto;

import com.agrocontrol.usuario.domain.EstadoUsuario;
import com.agrocontrol.usuario.domain.Usuario;

import java.time.LocalDateTime;

public record UsuarioResponse(
        Long id,
        String nombreCompleto,
        String email,
        Long rolId,
        EstadoUsuario estado,
        LocalDateTime creadoEn,
        boolean debeCambiarPassword
) {
    public static UsuarioResponse desde(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                usuario.getRolId(),
                usuario.getEstado(),
                usuario.getCreadoEn(),
                usuario.isDebeCambiarPassword()
        );
    }
}
