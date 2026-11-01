package com.agrocontrol.auth.infrastructure.adapter.in.web.dto;

import com.agrocontrol.auth.application.Sesion;

public record SesionResponse(
        String token,
        Long usuarioId,
        String nombreCompleto,
        String email,
        String rol,
        boolean debeCambiarPassword
) {
    public static SesionResponse desde(Sesion sesion) {
        return new SesionResponse(
                sesion.token(),
                sesion.usuario().getId(),
                sesion.usuario().getNombreCompleto(),
                sesion.usuario().getEmail(),
                sesion.rol(),
                sesion.usuario().isDebeCambiarPassword()
        );
    }
}
