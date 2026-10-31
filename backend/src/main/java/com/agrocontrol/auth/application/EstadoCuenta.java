package com.agrocontrol.auth.application;

public record EstadoCuenta(boolean activo, int tokenVersion, boolean debeCambiarPassword) {
}
