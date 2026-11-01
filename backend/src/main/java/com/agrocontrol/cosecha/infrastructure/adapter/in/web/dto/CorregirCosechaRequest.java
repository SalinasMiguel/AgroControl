package com.agrocontrol.cosecha.infrastructure.adapter.in.web.dto;

import com.agrocontrol.cosecha.domain.CalidadCosecha;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CorregirCosechaRequest(
        @NotBlank(message = "El motivo es obligatorio.")
        @Size(max = 200, message = "El motivo admite como máximo 200 caracteres.")
        String motivo,

        @NotNull(message = "La cantidad es obligatoria.")
        @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor que cero.")
        @Digits(integer = 10, fraction = 2, message = "La cantidad admite 10 enteros y 2 decimales.")
        BigDecimal cantidad,

        @NotBlank(message = "La unidad de medida es obligatoria.")
        @Size(max = 20, message = "La unidad admite como máximo 20 caracteres.")
        String unidadMedida,

        LocalDate fecha,

        // Opcionales: lo que dice la boleta de balanza
        @DecimalMin(value = "0", message = "La humedad no puede ser negativa.")
        @DecimalMax(value = "100", message = "La humedad no puede superar el 100 %.")
        BigDecimal humedadPct,

        @DecimalMin(value = "0", message = "Las impurezas no pueden ser negativas.")
        @DecimalMax(value = "100", message = "Las impurezas no pueden superar el 100 %.")
        BigDecimal impurezasPct,

        @Size(max = 30, message = "La boleta admite como máximo 30 caracteres.")
        String numeroBoleta
) {
    public CalidadCosecha calidad() {
        return new CalidadCosecha(humedadPct, impurezasPct, numeroBoleta);
    }
}
