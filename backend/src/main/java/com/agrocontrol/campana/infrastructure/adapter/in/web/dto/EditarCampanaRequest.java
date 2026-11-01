package com.agrocontrol.campana.infrastructure.adapter.in.web.dto;

import com.agrocontrol.campana.domain.PlanSiembra;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EditarCampanaRequest(
        @NotNull(message = "Debe indicar el cultivo.")
        Long cultivoId,

        @NotNull(message = "La fecha de inicio es obligatoria.")
        LocalDate fechaInicio,

        // Opcionales: lo que se siembra de verdad
        @Positive(message = "La superficie sembrada debe ser mayor que cero.")
        @Digits(integer = 8, fraction = 2, message = "Use como máximo 2 decimales.")
        BigDecimal areaSembradaHa,

        @Size(max = 80, message = "La variedad admite como máximo 80 caracteres.")
        String variedad,

        LocalDate fechaCosechaEstimada
) {
    public PlanSiembra plan() {
        return new PlanSiembra(areaSembradaHa, variedad, fechaCosechaEstimada);
    }
}
