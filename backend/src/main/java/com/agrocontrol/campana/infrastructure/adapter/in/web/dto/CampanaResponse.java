package com.agrocontrol.campana.infrastructure.adapter.in.web.dto;

import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.campana.domain.Campana;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CampanaResponse(
        Long id,
        Long parcelaId,
        Long cultivoId,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        EstadoCampana estado,
        String motivoCierre,
        BigDecimal areaSembradaHa,
        String variedad,
        LocalDate fechaCosechaEstimada
) {
    public static CampanaResponse desde(Campana campana) {
        return new CampanaResponse(
                campana.getId(),
                campana.getParcelaId(),
                campana.getCultivoId(),
                campana.getFechaInicio(),
                campana.getFechaFin(),
                campana.getEstado(),
                campana.getMotivoCierre(),
                campana.getPlan().areaSembradaHa(),
                campana.getPlan().variedad(),
                campana.getPlan().fechaCosechaEstimada()
        );
    }
}
