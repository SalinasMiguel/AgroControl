package com.agrocontrol.incidencia.infrastructure.adapter.out.persistence;

import com.agrocontrol.incidencia.domain.Incidencia;
import com.agrocontrol.shared.domain.Anulacion;

public final class IncidenciaPersistenceMapper {

    private IncidenciaPersistenceMapper() {
    }

    public static Incidencia toDomain(IncidenciaJpaEntity entity) {
        return Incidencia.reconstruir(entity.getId(), entity.getParcelaId(), entity.getCampanaId(), entity.getLaborId(),
                                      entity.getDescripcion(), entity.getUsuarioId(), entity.getFecha(),
                                      entity.getEstado(), entity.getResolucion(), entity.getResueltaEn(),
                                      entity.getAnuladoEn() == null ? null : new Anulacion(entity.getMotivoAnulacion(),
                                              entity.getAnuladoPor(), entity.getAnuladoEn()));
    }

    public static IncidenciaJpaEntity toEntity(Incidencia i) {
        Anulacion anulacion = i.getAnulacion();
        return new IncidenciaJpaEntity(i.getId(), i.getParcelaId(), i.getCampanaId(), i.getLaborId(),
                                       i.getDescripcion(), i.getUsuarioId(), i.getFecha(), i.getEstado(),
                                       i.getResolucion(), i.getResueltaEn(),
                                       anulacion == null ? null : anulacion.motivo(),
                                       anulacion == null ? null : anulacion.usuarioId(),
                                       anulacion == null ? null : anulacion.fecha());
    }
}
