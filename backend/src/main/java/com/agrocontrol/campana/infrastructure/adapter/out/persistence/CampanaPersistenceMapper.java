package com.agrocontrol.campana.infrastructure.adapter.out.persistence;

import com.agrocontrol.campana.domain.Campana;
import com.agrocontrol.campana.domain.PlanSiembra;

public final class CampanaPersistenceMapper {

    private CampanaPersistenceMapper() {
    }

    public static Campana toDomain(CampanaJpaEntity entity) {
        return Campana.reconstruir(entity.getId(), entity.getParcelaId(), entity.getCultivoId(),
                                   entity.getFechaInicio(), entity.getFechaFin(), entity.getEstado(),
                                   entity.getMotivoCierre(),
                                   new PlanSiembra(entity.getAreaSembradaHa(), entity.getVariedad(), entity.getFechaCosechaEstimada()));
    }

    public static CampanaJpaEntity toEntity(Campana c) {
        return new CampanaJpaEntity(c.getId(), c.getParcelaId(), c.getCultivoId(), c.getFechaInicio(), c.getFechaFin(),
                                    c.getEstado(), c.getMotivoCierre(), c.getPlan().areaSembradaHa(), c.getPlan().variedad(),
                                    c.getPlan().fechaCosechaEstimada());
    }
}
