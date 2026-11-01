package com.agrocontrol.auth.infrastructure.security;

import com.agrocontrol.auth.domain.Roles;
import org.springframework.security.oauth2.jwt.Jwt;

// Lectura de los claims del JWT que llega en Authorization: Bearer ...
public final class UsuarioAutenticado {

    private UsuarioAutenticado() {
    }

    public static Long id(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    public static String rol(Jwt jwt) {
        return jwt.getClaimAsString("rol");
    }

    // Un token emitido antes de V8 no trae "ver": cuenta como versión 0.
    public static int version(Jwt jwt) {
        Number version = jwt.getClaim("ver");
        return version == null ? 0 : version.intValue();
    }

    public static boolean esOperario(Jwt jwt) {
        return Roles.OPERARIO.equals(rol(jwt));
    }
}
