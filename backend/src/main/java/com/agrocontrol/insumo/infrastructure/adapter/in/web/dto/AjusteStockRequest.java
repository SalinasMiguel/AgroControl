package com.agrocontrol.insumo.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AjusteStockRequest(
        @NotNull(message = "El stock contado es obligatorio.")
        @DecimalMin(value = "0", message = "El stock contado no puede ser negativo.")
        @Digits(integer = 10, fraction = 2, message = "El stock admite 10 enteros y 2 decimales.")
        BigDecimal stockContado,

        @NotBlank(message = "El motivo es obligatorio.")
        @Size(max = 150, message = "El motivo admite como máximo 150 caracteres.")
        String motivo
) {
}
