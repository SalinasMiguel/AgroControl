package com.agrocontrol.cosecha.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RegistrarCosechaRequest(
        @NotNull(message = "Debe indicar la campaña.")
        Long campanaId,

        @NotNull(message = "La cantidad es obligatoria.")
        @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor que cero.")
        @Digits(integer = 10, fraction = 2, message = "La cantidad admite 10 enteros y 2 decimales.")
        BigDecimal cantidad,

        @NotBlank(message = "La unidad de medida es obligatoria.")
        @Size(max = 20, message = "La unidad admite como máximo 20 caracteres.")
        String unidadMedida,

        // Opcional: sin fecha, se registra con la de hoy
        LocalDate fecha
) {
}
