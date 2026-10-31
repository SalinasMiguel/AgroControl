package com.agrocontrol.labor.infrastructure.adapter.in.web.dto;

import com.agrocontrol.labor.domain.EstadoLabor;
import com.agrocontrol.labor.domain.Labor;

import java.time.LocalDate;

public record LaborResponse(
        Long id,
        Long campanaId,
        Long parcelaId,
        String tipo,
        LocalDate fechaPlan,
        LocalDate fechaEjecucion,
        EstadoLabor estado,
        String motivoCancelacion
) {
    public static LaborResponse desde(Labor labor) {
        return new LaborResponse(
                labor.getId(),
                labor.getCampanaId(),
                labor.getParcelaId(),
                labor.getTipo(),
                labor.getFechaPlan(),
                labor.getFechaEjecucion(),
                labor.getEstado(),
                labor.getMotivoCancelacion()
        );
    }
}
