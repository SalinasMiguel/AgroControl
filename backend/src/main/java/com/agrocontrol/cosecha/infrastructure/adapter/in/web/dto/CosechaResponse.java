package com.agrocontrol.cosecha.infrastructure.adapter.in.web.dto;

import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.shared.domain.Anulacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CosechaResponse(
        Long id,
        Long campanaId,
        BigDecimal cantidad,
        String unidadMedida,
        BigDecimal toneladas,
        LocalDate fecha,
        Long usuarioId,
        boolean anulado,
        String motivoAnulacion,
        Long anuladoPor,
        LocalDateTime anuladoEn,
        BigDecimal humedadPct,
        BigDecimal impurezasPct,
        String numeroBoleta
) {
    public static CosechaResponse desde(Cosecha cosecha) {
        Anulacion anulacion = cosecha.getAnulacion();
        return new CosechaResponse(
                cosecha.getId(),
                cosecha.getCampanaId(),
                cosecha.getCantidad(),
                cosecha.getUnidadMedida(),
                cosecha.getToneladas(),
                cosecha.getFecha(),
                cosecha.getUsuarioId(),
                cosecha.isAnulado(),
                anulacion == null ? null : anulacion.motivo(),
                anulacion == null ? null : anulacion.usuarioId(),
                anulacion == null ? null : anulacion.fecha(),
                cosecha.getCalidad().humedadPct(),
                cosecha.getCalidad().impurezasPct(),
                cosecha.getCalidad().numeroBoleta()
        );
    }
}
