-- V7_1__codigo_y_marca_de_insumo.sql — Identifica cada repuesto por su código y su marca.
-- Son opcionales: no todo lo que entra al almacén trae código (diésel, semilla a granel).

ALTER TABLE agrocontrol.insumo
    ADD COLUMN codigo varchar(40),
    ADD COLUMN marca varchar(60);

-- Un mismo código de la misma marca es la misma pieza: no se puede registrar dos veces.
CREATE UNIQUE INDEX uq_insumo_codigo_marca
    ON agrocontrol.insumo (upper(codigo), upper(coalesce(marca, '')))
    WHERE codigo IS NOT NULL;
