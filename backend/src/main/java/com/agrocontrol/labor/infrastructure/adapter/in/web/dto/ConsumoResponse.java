package com.agrocontrol.labor.infrastructure.adapter.in.web.dto;

import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.shared.domain.Anulacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ConsumoResponse(
        Long id,
        Long laborId,
        Long insumoId,
        BigDecimal cantidad,
        LocalDateTime fecha,
        boolean anulado,
        String motivoAnulacion,
        Long anuladoPor,
        LocalDateTime anuladoEn
) {
    public static ConsumoResponse desde(ConsumoLabor consumo) {
        Anulacion anulacion = consumo.getAnulacion();
        return new ConsumoResponse(
                consumo.getId(),
                consumo.getLaborId(),
                consumo.getInsumoId(),
                consumo.getCantidad(),
                consumo.getFecha(),
                consumo.isAnulado(),
                anulacion == null ? null : anulacion.motivo(),
                anulacion == null ? null : anulacion.usuarioId(),
                anulacion == null ? null : anulacion.fecha()
        );
    }
}
