package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.insumo.domain.ConsumoLabor;
import com.agrocontrol.shared.persistence.AnulacionEmbeddable;

public final class ConsumoLaborPersistenceMapper {

    private ConsumoLaborPersistenceMapper() {
    }

    public static ConsumoLabor toDomain(ConsumoLaborJpaEntity entity) {
        return ConsumoLabor.reconstruir(entity.getId(), entity.getLaborId(), entity.getInsumoId(), entity.getCantidad(),
                                        entity.getFecha(), entity.getAnulacion().aDominio());
    }

    public static ConsumoLaborJpaEntity toEntity(ConsumoLabor c) {
        return new ConsumoLaborJpaEntity(c.getId(), c.getLaborId(), c.getInsumoId(), c.getCantidad(), c.getFecha(),
                                         AnulacionEmbeddable.desde(c.getAnulacion()));
    }
}
