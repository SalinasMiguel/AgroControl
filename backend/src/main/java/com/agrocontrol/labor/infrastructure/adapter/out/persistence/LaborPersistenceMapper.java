package com.agrocontrol.labor.infrastructure.adapter.out.persistence;

import com.agrocontrol.labor.domain.Labor;

public final class LaborPersistenceMapper {

    private LaborPersistenceMapper() {
    }

    public static Labor toDomain(LaborJpaEntity entity) {
        return Labor.reconstruir(entity.getId(), entity.getCampanaId(), entity.getParcelaId(), entity.getTipo(),
                                 entity.getFechaPlan(), entity.getFechaEjecucion(), entity.getEstado(),
                                 entity.getCreadoEn(), entity.getMotivoCancelacion());
    }

    public static LaborJpaEntity toEntity(Labor l) {
        return new LaborJpaEntity(l.getId(), l.getCampanaId(), l.getParcelaId(), l.getTipo(), l.getFechaPlan(),
                                  l.getFechaEjecucion(), l.getEstado(), l.getCreadoEn(), l.getMotivoCancelacion());
    }
}
