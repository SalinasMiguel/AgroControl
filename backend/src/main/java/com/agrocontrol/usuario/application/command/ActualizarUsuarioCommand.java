package com.agrocontrol.usuario.application.command;

public record ActualizarUsuarioCommand(Long rolId, String nombreCompleto, String email) {
}
