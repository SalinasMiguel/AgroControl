package com.agrocontrol.campana.application;

import com.agrocontrol.campana.domain.EstadoCampana;
import com.agrocontrol.insumo.domain.CategoriaInsumo;

import java.math.BigDecimal;
import java.util.List;

/**
 * Resumen de una campaña para el jefe de campo (RF-15): cuánto trabajo se hizo, qué se gastó, qué se
 * cosechó y qué problemas siguen abiertos. Es un modelo de lectura: se calcula, no se guarda.
 */
public record AvanceCampana(
        Long campanaId,
        String cultivo,
        EstadoCampana estado,
        int laboresTotal,
        int laboresPlanificadas,
        int laboresEnCurso,
        int laboresEjecutadas,
        int porcentajeLabores,
        int diasTranscurridos,
        Integer cicloDias,
        Integer porcentajeCiclo,
        List<InsumoConsumido> insumos,
        List<CosechaTotal> cosecha,
        BigDecimal cosechaToneladas,
        BigDecimal rendimientoToneladasPorHa,
        int incidenciasAbiertas,
        int incidenciasTotal
) {
    public record InsumoConsumido(Long insumoId, String nombre, CategoriaInsumo categoria, String unidadMedida,
                                  BigDecimal cantidad) {
    }

    public record CosechaTotal(String unidadMedida, BigDecimal cantidad) {
    }
}
