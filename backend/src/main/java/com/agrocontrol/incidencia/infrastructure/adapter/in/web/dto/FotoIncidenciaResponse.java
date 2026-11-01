package com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto;

import com.agrocontrol.incidencia.domain.FotoIncidencia;

import java.time.LocalDateTime;

public record FotoIncidenciaResponse(Long id, Long incidenciaId, String tipoContenido, int tamano, Long usuarioId,
                                     LocalDateTime fecha) {
    public static FotoIncidenciaResponse desde(FotoIncidencia foto) {
        return new FotoIncidenciaResponse(foto.id(), foto.incidenciaId(), foto.tipoContenido(), foto.tamano(),
                foto.usuarioId(), foto.fecha());
    }
}
