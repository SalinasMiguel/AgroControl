package com.agrocontrol.campana.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

// Qué se siembra y hasta cuándo se espera cosechar; todo opcional.
public record PlanSiembra(BigDecimal areaSembradaHa, String variedad, LocalDate fechaCosechaEstimada) {

    public static final PlanSiembra VACIO = new PlanSiembra(null, null, null);

    public PlanSiembra {
        if (areaSembradaHa != null && areaSembradaHa.signum() <= 0) {
            throw new IllegalArgumentException("La superficie sembrada debe ser mayor que cero");
        }
        variedad = variedad == null || variedad.isBlank() ? null : variedad.trim();
    }
}
