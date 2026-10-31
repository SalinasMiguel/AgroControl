package com.agrocontrol.labor.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EditarLaborRequest(
        @NotBlank(message = "El tipo de labor es obligatorio.")
        @Size(max = 60, message = "El tipo admite como máximo 60 caracteres.")
        String tipo,

        @NotNull(message = "La fecha planificada es obligatoria.")
        LocalDate fechaPlan
) {
}
