package com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto;

import com.agrocontrol.incidencia.domain.EstadoIncidencia;
import com.agrocontrol.incidencia.domain.GravedadIncidencia;
import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.incidencia.domain.TipoIncidencia;
import com.agrocontrol.shared.domain.Anulacion;

import java.time.LocalDateTime;

public record IncidenciaResponse(
        Long id,
        Long parcelaId,
        Long campanaId,
        Long laborId,
        String descripcion,
        Long usuarioId,
        LocalDateTime fecha,
        EstadoIncidencia estado,
        String resolucion,
        LocalDateTime resueltaEn,
        String motivoAnulacion,
        Long anuladoPor,
        LocalDateTime anuladoEn,
        TipoIncidencia tipo,
        GravedadIncidencia gravedad,
        Long responsableId
) {
    public static IncidenciaResponse desde(Incidencia incidencia) {
        Anulacion anulacion = incidencia.getAnulacion();
        return new IncidenciaResponse(
                incidencia.getId(),
                incidencia.getParcelaId(),
                incidencia.getCampanaId(),
                incidencia.getLaborId(),
                incidencia.getDescripcion(),
                incidencia.getUsuarioId(),
                incidencia.getFecha(),
                incidencia.getEstado(),
                incidencia.getResolucion(),
                incidencia.getResueltaEn(),
                anulacion == null ? null : anulacion.motivo(),
                anulacion == null ? null : anulacion.usuarioId(),
                anulacion == null ? null : anulacion.fecha(),
                incidencia.getTipo(),
                incidencia.getGravedad(),
                incidencia.getResponsableId()
        );
    }
}
