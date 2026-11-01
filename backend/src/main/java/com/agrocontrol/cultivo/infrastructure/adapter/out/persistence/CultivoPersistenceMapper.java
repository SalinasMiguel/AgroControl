package com.agrocontrol.cultivo.infrastructure.adapter.out.persistence;

import com.agrocontrol.cultivo.domain.Cultivo;

public final class CultivoPersistenceMapper {

    private CultivoPersistenceMapper() {
    }

    public static Cultivo toDomain(CultivoJpaEntity entity) {
        return Cultivo.reconstruir(entity.getId(), entity.getNombre(), entity.getCicloDias(), entity.getHumedadEstandarPct());
    }

    public static CultivoJpaEntity toEntity(Cultivo c) {
        return new CultivoJpaEntity(c.getId(), c.getNombre(), c.getCicloDias(), c.getHumedadEstandarPct());
    }
}
