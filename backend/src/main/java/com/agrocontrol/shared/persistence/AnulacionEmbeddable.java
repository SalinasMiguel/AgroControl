package com.agrocontrol.shared.persistence;

import com.agrocontrol.shared.domain.Anulacion;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.time.LocalDateTime;

// Columnas comunes de cosecha, consumo_labor y movimiento_insumo (V9).
@Embeddable
public class AnulacionEmbeddable {

    @Column(name = "anulado", nullable = false)
    private boolean anulado;

    @Column(name = "motivo_anulacion", length = 200)
    private String motivo;

    @Column(name = "anulado_por")
    private Long usuarioId;

    @Column(name = "anulado_en")
    private LocalDateTime fecha;

    protected AnulacionEmbeddable() {
    }

    public static AnulacionEmbeddable desde(Anulacion anulacion) {
        AnulacionEmbeddable embeddable = new AnulacionEmbeddable();
        if (anulacion != null) {
            embeddable.anulado = true;
            embeddable.motivo = anulacion.motivo();
            embeddable.usuarioId = anulacion.usuarioId();
            embeddable.fecha = anulacion.fecha();
        }
        return embeddable;
    }

    public Anulacion aDominio() {
        return anulado ? new Anulacion(motivo, usuarioId, fecha) : null;
    }
}
