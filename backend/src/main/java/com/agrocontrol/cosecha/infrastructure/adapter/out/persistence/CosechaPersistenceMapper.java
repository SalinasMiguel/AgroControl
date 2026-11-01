package com.agrocontrol.cosecha.infrastructure.adapter.out.persistence;

import com.agrocontrol.cosecha.domain.Cosecha;
import com.agrocontrol.shared.persistence.AnulacionEmbeddable;

public final class CosechaPersistenceMapper {

    private CosechaPersistenceMapper() {
    }

    public static Cosecha toDomain(CosechaJpaEntity entity) {
        return Cosecha.reconstruir(entity.getId(), entity.getCampanaId(), entity.getCantidad(),
                                   entity.getUnidadMedida(), entity.getFecha(), entity.getUsuarioId(),
                                   entity.getAnulacion().aDominio());
    }

    public static CosechaJpaEntity toEntity(Cosecha c) {
        return new CosechaJpaEntity(c.getId(), c.getCampanaId(), c.getCantidad(), c.getUnidadMedida(), c.getFecha(),
                                    c.getUsuarioId(), AnulacionEmbeddable.desde(c.getAnulacion()));
    }
}
