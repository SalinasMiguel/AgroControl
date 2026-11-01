package com.agrocontrol.insumo.infrastructure.adapter.in.web.dto;

import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.insumo.domain.OrigenMovimiento;
import com.agrocontrol.insumo.domain.TipoMovimiento;
import com.agrocontrol.shared.domain.Anulacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MovimientoResponse(
        Long id,
        Long insumoId,
        TipoMovimiento tipo,
        BigDecimal cantidad,
        String motivo,
        Long usuarioId,
        LocalDateTime fecha,
        OrigenMovimiento origen,
        boolean anulado,
        String motivoAnulacion,
        Long anuladoPor,
        LocalDateTime anuladoEn,
        String proveedor,
        String numeroFactura
) {
    public static MovimientoResponse desde(MovimientoInsumo movimiento) {
        Anulacion anulacion = movimiento.getAnulacion();
        return new MovimientoResponse(
                movimiento.getId(),
                movimiento.getInsumoId(),
                movimiento.getTipo(),
                movimiento.getCantidad(),
                movimiento.getMotivo(),
                movimiento.getUsuarioId(),
                movimiento.getFecha(),
                movimiento.getOrigen(),
                movimiento.isAnulado(),
                anulacion == null ? null : anulacion.motivo(),
                anulacion == null ? null : anulacion.usuarioId(),
                anulacion == null ? null : anulacion.fecha(),
                movimiento.getDocumento().proveedor(),
                movimiento.getDocumento().numeroFactura()
        );
    }
}
