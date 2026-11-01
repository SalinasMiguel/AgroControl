package com.agrocontrol.cultivo.infrastructure.adapter.in.web.dto;

import com.agrocontrol.cultivo.domain.Cultivo;

import java.math.BigDecimal;

public record CultivoResponse(Long id, String nombre, Integer cicloDias, BigDecimal humedadEstandarPct) {
    public static CultivoResponse desde(Cultivo cultivo) {
        return new CultivoResponse(cultivo.getId(), cultivo.getNombre(), cultivo.getCicloDias(), cultivo.getHumedadEstandarPct());
    }
}
