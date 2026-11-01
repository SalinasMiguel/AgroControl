package com.agrocontrol.shared.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Cancelar, anular o reabrir siempre dicen por qué.
public record MotivoRequest(
        @NotBlank(message = "El motivo es obligatorio.")
        @Size(max = 200, message = "El motivo admite como máximo 200 caracteres.")
        String motivo
) {
}
