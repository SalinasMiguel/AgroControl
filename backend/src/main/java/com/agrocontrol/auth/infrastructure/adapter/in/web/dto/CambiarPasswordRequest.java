package com.agrocontrol.auth.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarPasswordRequest(
        @NotBlank String passwordActual,
        @NotBlank @Size(min = 8, max = 72) String passwordNueva
) {
    @Override
    public String toString() {
        return "CambiarPasswordRequest[***]";
    }
}
