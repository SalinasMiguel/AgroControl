package com.agrocontrol.usuario.application;

public record ClaveTemporal(String password) {

    @Override
    public String toString() {
        return "ClaveTemporal[***]";
    }
}
