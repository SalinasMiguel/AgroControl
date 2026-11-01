-- V11__siembra_de_campana.sql — Qué se sembró de verdad en cada campaña.
-- Son opcionales: las campañas anteriores no los tienen, y sin superficie el rendimiento usa el área de la parcela.

ALTER TABLE agrocontrol.campana
    ADD COLUMN area_sembrada_ha numeric(10,2),
    ADD COLUMN variedad varchar(80),
    ADD COLUMN fecha_cosecha_estimada date,
    ADD CONSTRAINT campana_area_sembrada_check CHECK (area_sembrada_ha > 0),
    ADD CONSTRAINT campana_cosecha_estimada_check CHECK (fecha_cosecha_estimada >= fecha_inicio);
