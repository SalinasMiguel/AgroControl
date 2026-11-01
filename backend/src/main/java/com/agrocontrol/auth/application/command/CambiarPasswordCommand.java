package com.agrocontrol.auth.application.command;

// Objeto y no dos String: AuditoriaAspect guarda los argumentos de texto, y una clave no debe llegar ahí.
public record CambiarPasswordCommand(String passwordActual, String passwordNueva) {

    @Override
    public String toString() {
        return "CambiarPasswordCommand[***]";
    }
}
