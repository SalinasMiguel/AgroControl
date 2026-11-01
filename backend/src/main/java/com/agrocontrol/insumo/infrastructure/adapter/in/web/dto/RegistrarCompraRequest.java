package com.agrocontrol.insumo.infrastructure.adapter.in.web.dto;

import com.agrocontrol.insumo.domain.DocumentoCompra;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RegistrarCompraRequest(
        @NotNull(message = "La cantidad es obligatoria.")
        @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor que cero.")
        @Digits(integer = 10, fraction = 2, message = "La cantidad admite 10 enteros y 2 decimales.")
        BigDecimal cantidad,

        @Size(max = 150, message = "El motivo admite como máximo 150 caracteres.")
        String motivo,

        @Size(max = 120, message = "El proveedor admite como máximo 120 caracteres.")
        String proveedor,

        @Size(max = 40, message = "La factura admite como máximo 40 caracteres.")
        String numeroFactura
) {
    public DocumentoCompra documento() {
        return new DocumentoCompra(proveedor, numeroFactura);
    }
}
