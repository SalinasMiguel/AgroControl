package com.agrocontrol.usuario.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ActualizarUsuarioRequest(
        @NotNull(message = "El rol es obligatorio")
        @Positive(message = "El id del rol debe ser positivo")
        Long rolId,

        @NotBlank(message = "El nombre completo es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombreCompleto,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        @Size(max = 150, message = "El email no puede superar 150 caracteres")
        String email
) {}
