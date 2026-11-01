package com.agrocontrol.cultivo.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CrearCultivoRequest(
        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 80, message = "El nombre admite como máximo 80 caracteres.")
        String nombre,

        @Positive(message = "El ciclo debe ser mayor que cero.")
        Integer cicloDias,

        @DecimalMin(value = "0", message = "La humedad estándar no puede ser negativa.")
        @DecimalMax(value = "99.99", message = "La humedad estándar debe ser menor que 100 %.")
        BigDecimal humedadEstandarPct
) {
}
