-- V7__combustibles_y_repuestos.sql — El almacén también maneja combustible, lubricantes y repuestos.
-- Cada insumo tiene categoría y stock mínimo (aviso de "por agotarse").

ALTER TABLE agrocontrol.insumo
    ADD COLUMN categoria varchar(20) NOT NULL DEFAULT 'OTRO',
    ADD COLUMN stock_minimo numeric(12,2) NOT NULL DEFAULT 0,
    ADD CONSTRAINT insumo_categoria_check CHECK (categoria IN
        ('SEMILLA', 'FERTILIZANTE', 'AGROQUIMICO', 'COMBUSTIBLE', 'LUBRICANTE', 'REPUESTO', 'OTRO')),
    ADD CONSTRAINT insumo_stock_minimo_check CHECK (stock_minimo >= 0);

CREATE INDEX idx_insumo_categoria ON agrocontrol.insumo (categoria);
CREATE INDEX idx_movimiento_tipo_fecha ON agrocontrol.movimiento_insumo (tipo, fecha);

-- Clasificar los insumos de la semilla (V2)
UPDATE agrocontrol.insumo SET categoria = 'SEMILLA', stock_minimo = 200 WHERE nombre = 'Semilla de soya certificada';
UPDATE agrocontrol.insumo SET categoria = 'FERTILIZANTE', stock_minimo = 100 WHERE nombre = 'Urea 46%';
UPDATE agrocontrol.insumo SET categoria = 'AGROQUIMICO', stock_minimo = 10 WHERE nombre = 'Glifosato 48%';

-- Combustible, lubricantes y repuestos de ejemplo. El stock entra con un movimiento ENTRADA
-- (y algunas SALIDA de este mes), igual que si lo hubiera cargado el almacenero.
CREATE TEMP TABLE carga_inicial (nombre text, unidad text, categoria text, minimo numeric, entrada numeric, salida numeric, uso text)
    ON COMMIT DROP;
INSERT INTO carga_inicial VALUES
    ('Diésel',                         'L',      'COMBUSTIBLE', 300, 1200, 180, 'Tractor 1 · preparación de suelo'),
    ('Gasolina especial',              'L',      'COMBUSTIBLE',  50,  150,  35, 'Motocicleta del capataz'),
    ('Aceite de motor 15W-40',         'L',      'LUBRICANTE',   20,   40,   8, 'Cambio de aceite tractor 1'),
    ('Grasa multipropósito',           'kg',     'LUBRICANTE',    5,    8, NULL, NULL),
    ('Filtro de aceite (tractor)',     'unidad', 'REPUESTO',      2,    4,   1, 'Cambio de aceite tractor 1'),
    ('Filtro de combustible',          'unidad', 'REPUESTO',      2,    2,   1, 'Tractor 1'),
    ('Punta de pulverizadora',         'unidad', 'REPUESTO',     10,   24, NULL, NULL);

INSERT INTO agrocontrol.insumo (nombre, unidad_medida, stock_actual, categoria, stock_minimo)
SELECT nombre, unidad, entrada - coalesce(salida, 0), categoria, minimo FROM carga_inicial;

INSERT INTO agrocontrol.movimiento_insumo (id_insumo, tipo, cantidad, motivo, id_usuario, fecha)
SELECT i.id_insumo, 'ENTRADA', c.entrada, 'Stock inicial',
       (SELECT id_usuario FROM agrocontrol.usuario WHERE email = 'almacen@agrocontrol.com'), now() - interval '5 days'
FROM carga_inicial c JOIN agrocontrol.insumo i ON i.nombre = c.nombre;

INSERT INTO agrocontrol.movimiento_insumo (id_insumo, tipo, cantidad, motivo, id_usuario, fecha)
SELECT i.id_insumo, 'SALIDA', c.salida, c.uso,
       (SELECT id_usuario FROM agrocontrol.usuario WHERE email = 'almacen@agrocontrol.com'), now() - interval '2 days'
FROM carga_inicial c JOIN agrocontrol.insumo i ON i.nombre = c.nombre
WHERE c.salida IS NOT NULL;
