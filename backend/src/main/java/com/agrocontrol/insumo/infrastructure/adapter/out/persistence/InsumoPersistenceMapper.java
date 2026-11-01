package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.insumo.domain.Insumo;

public final class InsumoPersistenceMapper {

    private InsumoPersistenceMapper() {
    }

    public static Insumo toDomain(InsumoJpaEntity entity) {
        return Insumo.reconstruir(entity.getId(), entity.getNombre(), entity.getUnidadMedida(),
                                  entity.getStockActual(), entity.getCategoria(), entity.getStockMinimo(),
                                  entity.getCodigo(), entity.getMarca());
    }

    public static InsumoJpaEntity toEntity(Insumo i) {
        return new InsumoJpaEntity(i.getId(), i.getNombre(), i.getUnidadMedida(), i.getStockActual(), i.getCategoria(),
                                   i.getStockMinimo(), i.getCodigo(), i.getMarca());
    }
}
