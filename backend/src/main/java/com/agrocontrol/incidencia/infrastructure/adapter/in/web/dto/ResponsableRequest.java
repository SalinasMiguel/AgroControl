package com.agrocontrol.incidencia.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;

public record ResponsableRequest(@NotNull(message = "Debe indicar el responsable.") Long usuarioId) {
}
