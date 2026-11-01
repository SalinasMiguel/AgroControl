package com.agrocontrol.campana.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EditarCampanaRequest(
        @NotNull(message = "Debe indicar el cultivo.")
        Long cultivoId,

        @NotNull(message = "La fecha de inicio es obligatoria.")
        LocalDate fechaInicio
) {
}
