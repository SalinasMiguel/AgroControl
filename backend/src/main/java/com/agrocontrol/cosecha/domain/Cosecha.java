package com.agrocontrol.cosecha.domain;

import com.agrocontrol.shared.domain.Anulacion;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Cosecha {

    private Long id;
    private Long campanaId;
    private BigDecimal cantidad;
    private String unidadMedida;
    private LocalDate fecha = LocalDate.now();
    private Long usuarioId;
    private Anulacion anulacion;
    private CalidadCosecha calidad = CalidadCosecha.VACIA;

    private Cosecha() {
    }

    // Rehidrata un registro ya guardado (lo usa el mapper de persistencia): no repite las validaciones de alta.
    public static Cosecha reconstruir(Long id, Long campanaId, BigDecimal cantidad, String unidadMedida,
                                      LocalDate fecha, Long usuarioId, Anulacion anulacion) {
        return reconstruir(id, campanaId, cantidad, unidadMedida, fecha, usuarioId, anulacion, CalidadCosecha.VACIA);
    }

    public static Cosecha reconstruir(Long id, Long campanaId, BigDecimal cantidad, String unidadMedida,
                                      LocalDate fecha, Long usuarioId, Anulacion anulacion, CalidadCosecha calidad) {
        Cosecha c = new Cosecha();
        c.id = id;
        c.campanaId = campanaId;
        c.cantidad = cantidad;
        c.unidadMedida = unidadMedida;
        c.fecha = fecha;
        c.usuarioId = usuarioId;
        c.anulacion = anulacion;
        c.calidad = calidad;
        return c;
    }

    public Cosecha(Long id, Long campanaId, BigDecimal cantidad, String unidadMedida, Long usuarioId) {
        this(id, campanaId, cantidad, unidadMedida, LocalDate.now(), usuarioId);
    }

    public Cosecha(Long id, Long campanaId, BigDecimal cantidad, String unidadMedida, LocalDate fecha, Long usuarioId) {
        if (campanaId == null) {
            throw new IllegalArgumentException("La cosecha debe estar asociada a una campaña");
        }
        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad cosechada debe ser mayor que cero");
        }
        if (unidadMedida == null || unidadMedida.isBlank()) {
            throw new IllegalArgumentException("La unidad de medida no puede estar vacía");
        }
        UnidadCosecha.desde(unidadMedida);
        if (usuarioId == null) {
            throw new IllegalArgumentException("La cosecha debe registrarse con un usuario");
        }
        this.id = id;
        this.campanaId = campanaId;
        this.cantidad = cantidad;
        this.unidadMedida = unidadMedida;
        this.fecha = fecha;
        this.usuarioId = usuarioId;
    }

    public void registrarCalidad(CalidadCosecha calidad) {
        this.calidad = calidad;
    }

    public void anular(String motivo, Long usuarioId) {
        if (isAnulado()) {
            throw new IllegalStateException("La cosecha ya está anulada");
        }
        this.anulacion = Anulacion.registrar(motivo, usuarioId);
    }

    public boolean isAnulado() { return anulacion != null; }

    public BigDecimal getToneladas() {
        return UnidadCosecha.desde(unidadMedida).aToneladas(cantidad);
    }

    public Long getId() { return id; }
    public Long getCampanaId() { return campanaId; }
    public BigDecimal getCantidad() { return cantidad; }
    public String getUnidadMedida() { return unidadMedida; }
    public LocalDate getFecha() { return fecha; }
    public Long getUsuarioId() { return usuarioId; }
    public Anulacion getAnulacion() { return anulacion; }
    public CalidadCosecha getCalidad() { return calidad; }
}
