package com.agrocontrol.insumo.infrastructure.adapter.out.persistence;

import com.agrocontrol.insumo.domain.MovimientoInsumo;
import com.agrocontrol.shared.persistence.AnulacionEmbeddable;

public final class MovimientoInsumoPersistenceMapper {

    private MovimientoInsumoPersistenceMapper() {
    }

    public static MovimientoInsumo toDomain(MovimientoInsumoJpaEntity entity) {
        return MovimientoInsumo.reconstruir(entity.getId(), entity.getInsumoId(), entity.getTipo(),
                                            entity.getCantidad(), entity.getMotivo(), entity.getUsuarioId(),
                                            entity.getFecha(), entity.getAnulacion().aDominio(), entity.getOrigen(),
                                            entity.getConsumoId(), entity.getMovimientoAnuladoId());
    }

    public static MovimientoInsumoJpaEntity toEntity(MovimientoInsumo m) {
        return new MovimientoInsumoJpaEntity(m.getId(), m.getInsumoId(), m.getTipo(), m.getCantidad(), m.getMotivo(),
                                             m.getUsuarioId(), m.getFecha(), AnulacionEmbeddable.desde(m.getAnulacion()),
                                             m.getOrigen(), m.getConsumoId(), m.getMovimientoAnuladoId());
    }
}
