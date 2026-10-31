package com.agrocontrol.insumo.domain;

import com.agrocontrol.shared.domain.Anulacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MovimientoInsumo {

    private static final int MAX_MOTIVO = 150;

    private Long id;
    private Long insumoId;
    private TipoMovimiento tipo;
    private BigDecimal cantidad;
    private String motivo;
    private Long usuarioId;
    private LocalDateTime fecha = LocalDateTime.now();
    private Anulacion anulacion;
    private OrigenMovimiento origen = OrigenMovimiento.MANUAL;
    private Long consumoId;
    private Long movimientoAnuladoId;

    private MovimientoInsumo() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static MovimientoInsumo reconstruir(Long id, Long insumoId, TipoMovimiento tipo, BigDecimal cantidad,
                                               String motivo, Long usuarioId, LocalDateTime fecha, Anulacion anulacion,
                                               OrigenMovimiento origen, Long consumoId, Long movimientoAnuladoId) {
        MovimientoInsumo m = new MovimientoInsumo();
        m.id = id;
        m.insumoId = insumoId;
        m.tipo = tipo;
        m.cantidad = cantidad;
        m.motivo = motivo;
        m.usuarioId = usuarioId;
        m.fecha = fecha;
        m.anulacion = anulacion;
        m.origen = origen;
        m.consumoId = consumoId;
        m.movimientoAnuladoId = movimientoAnuladoId;
        return m;
    }

    public static MovimientoInsumo deConsumo(Long insumoId, BigDecimal cantidad, String motivo, Long usuarioId, Long consumoId) {
        MovimientoInsumo m = new MovimientoInsumo(null, insumoId, TipoMovimiento.SALIDA, cantidad, motivo, usuarioId);
        m.origen = OrigenMovimiento.CONSUMO;
        m.consumoId = consumoId;
        return m;
    }

    public static MovimientoInsumo deAjuste(Long insumoId, TipoMovimiento tipo, BigDecimal cantidad, String motivo, Long usuarioId) {
        MovimientoInsumo m = new MovimientoInsumo(null, insumoId, tipo, cantidad, motivo, usuarioId);
        m.origen = OrigenMovimiento.AJUSTE;
        return m;
    }

    // El stock nunca se corrige a mano: anular crea el movimiento contrario, y ambos quedan en el historial.
    public static MovimientoInsumo inversoDe(MovimientoInsumo original, String motivo, Long usuarioId) {
        TipoMovimiento contrario = original.tipo == TipoMovimiento.ENTRADA ? TipoMovimiento.SALIDA : TipoMovimiento.ENTRADA;
        String texto = "Anulación: " + motivo;
        MovimientoInsumo m = new MovimientoInsumo(null, original.insumoId, contrario, original.cantidad,
                texto.length() > MAX_MOTIVO ? texto.substring(0, MAX_MOTIVO) : texto, usuarioId);
        m.origen = OrigenMovimiento.ANULACION;
        m.movimientoAnuladoId = original.id;
        return m;
    }

    public MovimientoInsumo(Long id, Long insumoId, TipoMovimiento tipo, BigDecimal cantidad, String motivo, Long usuarioId) {
        if (insumoId == null) {
            throw new IllegalArgumentException("El movimiento debe estar asociado a un insumo");
        }
        if (tipo == null) {
            throw new IllegalArgumentException("El tipo de movimiento es obligatorio");
        }
        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero");
        }
        if (usuarioId == null) {
            throw new IllegalArgumentException("El movimiento debe indicar un usuario");
        }
        this.id = id;
        this.insumoId = insumoId;
        this.tipo = tipo;
        this.cantidad = cantidad;
        this.motivo = motivo;
        this.usuarioId = usuarioId;
    }

    public void anular(String motivo, Long usuarioId) {
        if (isAnulado()) {
            throw new IllegalStateException("El movimiento ya está anulado");
        }
        this.anulacion = Anulacion.registrar(motivo, usuarioId);
    }

    public boolean esAnulableDirecto() {
        return origen == OrigenMovimiento.MANUAL || origen == OrigenMovimiento.AJUSTE;
    }

    public boolean isAnulado() { return anulacion != null; }

    public Long getId() { return id; }
    public Long getInsumoId() { return insumoId; }
    public TipoMovimiento getTipo() { return tipo; }
    public BigDecimal getCantidad() { return cantidad; }
    public String getMotivo() { return motivo; }
    public Long getUsuarioId() { return usuarioId; }
    public LocalDateTime getFecha() { return fecha; }
    public Anulacion getAnulacion() { return anulacion; }
    public OrigenMovimiento getOrigen() { return origen; }
    public Long getConsumoId() { return consumoId; }
    public Long getMovimientoAnuladoId() { return movimientoAnuladoId; }
}
