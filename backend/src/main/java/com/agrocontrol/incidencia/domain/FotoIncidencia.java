package com.agrocontrol.incidencia.domain;

import java.time.LocalDateTime;

// En los listados datos viene null: las fotos pesan y solo se leen al abrirlas.
public record FotoIncidencia(Long id, Long incidenciaId, String tipoContenido, int tamano, byte[] datos,
                             Long usuarioId, LocalDateTime fecha) {

    public FotoIncidencia(Long id, Long incidenciaId, String tipoContenido, int tamano, Long usuarioId,
                          LocalDateTime fecha) {
        this(id, incidenciaId, tipoContenido, tamano, null, usuarioId, fecha);
    }
}
