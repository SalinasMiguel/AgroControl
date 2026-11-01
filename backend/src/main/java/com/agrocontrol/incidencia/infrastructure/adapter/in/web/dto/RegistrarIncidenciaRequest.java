package com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto;

import com.agrocontrol.incidencia.domain.GravedadIncidencia;
import com.agrocontrol.incidencia.domain.TipoIncidencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// parcelaId, campanaId y laborId son opcionales por separado, pero debe venir al menos uno.
public record RegistrarIncidenciaRequest(
        Long parcelaId,

        Long campanaId,

        Long laborId,

        @NotBlank(message = "La descripción es obligatoria.")
        @Size(max = 1000, message = "La descripción admite como máximo 1000 caracteres.")
        String descripcion,

        // Opcionales: sin ellos queda como OTRO y MEDIA
        TipoIncidencia tipo,

        GravedadIncidencia gravedad
) {
}
