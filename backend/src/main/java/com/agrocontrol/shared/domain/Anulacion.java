package com.agrocontrol.shared.domain;

import java.time.LocalDateTime;

// Un hecho registrado no se borra (RN-09): se anula diciendo quién, cuándo y por qué.
public record Anulacion(String motivo, Long usuarioId, LocalDateTime fecha) {

    public static Anulacion registrar(String motivo, Long usuarioId) {
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo es obligatorio");
        }
        if (usuarioId == null) {
            throw new IllegalArgumentException("La anulación debe registrarse con un usuario");
        }
        return new Anulacion(motivo, usuarioId, LocalDateTime.now());
    }
}
