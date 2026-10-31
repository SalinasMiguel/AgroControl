package com.agrocontrol.insumo.domain;

import com.agrocontrol.shared.domain.Anulacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ConsumoLabor {

    private Long id;
    private Long laborId;
    private Long insumoId;
    private BigDecimal cantidad;
    private LocalDateTime fecha = LocalDateTime.now();
    private Anulacion anulacion;

    private ConsumoLabor() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static ConsumoLabor reconstruir(Long id, Long laborId, Long insumoId, BigDecimal cantidad,
                                           LocalDateTime fecha, Anulacion anulacion) {
        ConsumoLabor c = new ConsumoLabor();
        c.id = id;
        c.laborId = laborId;
        c.insumoId = insumoId;
        c.cantidad = cantidad;
        c.fecha = fecha;
        c.anulacion = anulacion;
        return c;
    }

    public ConsumoLabor(Long id, Long laborId, Long insumoId, BigDecimal cantidad) {
        if (laborId == null) {
            throw new IllegalArgumentException("El consumo debe estar asociado a una labor");
        }
        if (insumoId == null) {
            throw new IllegalArgumentException("El consumo debe estar asociado a un insumo");
        }
        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad consumida debe ser mayor que cero");
        }
        this.id = id;
        this.laborId = laborId;
        this.insumoId = insumoId;
        this.cantidad = cantidad;
    }

    public void anular(String motivo, Long usuarioId) {
        if (isAnulado()) {
            throw new IllegalStateException("El consumo ya está anulado");
        }
        this.anulacion = Anulacion.registrar(motivo, usuarioId);
    }

    public boolean isAnulado() { return anulacion != null; }

    public Long getId() { return id; }
    public Long getLaborId() { return laborId; }
    public Long getInsumoId() { return insumoId; }
    public BigDecimal getCantidad() { return cantidad; }
    public LocalDateTime getFecha() { return fecha; }
    public Anulacion getAnulacion() { return anulacion; }
}
