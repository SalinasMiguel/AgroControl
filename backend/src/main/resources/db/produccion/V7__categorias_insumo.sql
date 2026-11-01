-- V7__categorias_insumo.sql — Misma estructura que la V7 de demo, sin su carga de ejemplo.

ALTER TABLE agrocontrol.insumo
    ADD COLUMN categoria varchar(20) NOT NULL DEFAULT 'OTRO',
    ADD COLUMN stock_minimo numeric(12,2) NOT NULL DEFAULT 0,
    ADD CONSTRAINT insumo_categoria_check CHECK (categoria IN
        ('SEMILLA', 'FERTILIZANTE', 'AGROQUIMICO', 'COMBUSTIBLE', 'LUBRICANTE', 'REPUESTO', 'OTRO')),
    ADD CONSTRAINT insumo_stock_minimo_check CHECK (stock_minimo >= 0);

CREATE INDEX idx_insumo_categoria ON agrocontrol.insumo (categoria);
CREATE INDEX idx_movimiento_tipo_fecha ON agrocontrol.movimiento_insumo (tipo, fecha);
