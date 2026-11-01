package com.agrocontrol.campana.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MarcarPerdidaRequest(
        @NotBlank(message = "El motivo es obligatorio.")
        @Size(max = 200, message = "El motivo admite como máximo 200 caracteres.")
        String motivo,

        @NotNull(message = "La fecha de fin es obligatoria.")
        LocalDate fechaFin
) {
}
