-- V9__corregir_y_anular.sql — Corregir sin borrar: los hechos se anulan con motivo y quedan en el historial (RN-09).
-- 1. Estados nuevos: labor ASIGNADA y CANCELADA (RN-03), campaña CANCELADA y PERDIDA, incidencia ANULADA.
-- 2. Cosechas, consumos y movimientos guardan quién anuló, cuándo y por qué.
-- 3. Cada movimiento dice de dónde salió (origen) y se enlaza con su consumo o con el movimiento que revierte.

ALTER TABLE agrocontrol.campana DROP CONSTRAINT campana_estado_check;
ALTER TABLE agrocontrol.campana
    ADD COLUMN motivo_cierre varchar(200),
    ADD CONSTRAINT campana_estado_check CHECK (estado IN ('PLANIFICADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA', 'PERDIDA'));

ALTER TABLE agrocontrol.labor DROP CONSTRAINT labor_estado_check;
ALTER TABLE agrocontrol.labor
    ADD COLUMN motivo_cancelacion varchar(200),
    ADD CONSTRAINT labor_estado_check CHECK (estado IN ('PLANIFICADA', 'ASIGNADA', 'EN_CURSO', 'EJECUTADA', 'CANCELADA'));

ALTER TABLE agrocontrol.cosecha
    ADD COLUMN anulado boolean NOT NULL DEFAULT false,
    ADD COLUMN motivo_anulacion varchar(200),
    ADD COLUMN anulado_por integer REFERENCES agrocontrol.usuario (id_usuario),
    ADD COLUMN anulado_en timestamp without time zone,
    ADD CONSTRAINT cosecha_anulado_check CHECK (
        NOT anulado OR (motivo_anulacion IS NOT NULL AND anulado_por IS NOT NULL AND anulado_en IS NOT NULL));

ALTER TABLE agrocontrol.consumo_labor
    ADD COLUMN anulado boolean NOT NULL DEFAULT false,
    ADD COLUMN motivo_anulacion varchar(200),
    ADD COLUMN anulado_por integer REFERENCES agrocontrol.usuario (id_usuario),
    ADD COLUMN anulado_en timestamp without time zone,
    ADD CONSTRAINT consumo_labor_anulado_check CHECK (
        NOT anulado OR (motivo_anulacion IS NOT NULL AND anulado_por IS NOT NULL AND anulado_en IS NOT NULL));

ALTER TABLE agrocontrol.movimiento_insumo
    ADD COLUMN anulado boolean NOT NULL DEFAULT false,
    ADD COLUMN motivo_anulacion varchar(200),
    ADD COLUMN anulado_por integer REFERENCES agrocontrol.usuario (id_usuario),
    ADD COLUMN anulado_en timestamp without time zone,
    ADD COLUMN origen varchar(10) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN id_consumo integer REFERENCES agrocontrol.consumo_labor (id_consumo),
    ADD COLUMN id_movimiento_anulado integer REFERENCES agrocontrol.movimiento_insumo (id_movimiento),
    ADD CONSTRAINT movimiento_insumo_anulado_check CHECK (
        NOT anulado OR (motivo_anulacion IS NOT NULL AND anulado_por IS NOT NULL AND anulado_en IS NOT NULL)),
    ADD CONSTRAINT movimiento_insumo_origen_check CHECK (origen IN ('MANUAL', 'CONSUMO', 'ANULACION', 'AJUSTE'));

-- Respaldo en la base: un consumo tiene una sola salida y un movimiento se revierte una sola vez.
CREATE UNIQUE INDEX uq_movimiento_consumo ON agrocontrol.movimiento_insumo (id_consumo) WHERE origen = 'CONSUMO';
CREATE UNIQUE INDEX uq_movimiento_anulado ON agrocontrol.movimiento_insumo (id_movimiento_anulado)
    WHERE id_movimiento_anulado IS NOT NULL;

ALTER TABLE agrocontrol.incidencia DROP CONSTRAINT incidencia_estado_check;
ALTER TABLE agrocontrol.incidencia
    ADD COLUMN motivo_anulacion varchar(200),
    ADD COLUMN anulado_por integer REFERENCES agrocontrol.usuario (id_usuario),
    ADD COLUMN anulado_en timestamp without time zone,
    ADD CONSTRAINT incidencia_estado_check CHECK (estado IN ('ABIERTA', 'EN_ATENCION', 'RESUELTA', 'ANULADA')),
    ADD CONSTRAINT incidencia_anulada_check CHECK (
        estado <> 'ANULADA' OR (motivo_anulacion IS NOT NULL AND anulado_por IS NOT NULL AND anulado_en IS NOT NULL));

-- ---------- Datos existentes ----------

-- Enlaza cada salida con su consumo. Dos consumos idénticos se reparten por orden, uno por salida.
UPDATE agrocontrol.movimiento_insumo SET origen = 'CONSUMO' WHERE motivo LIKE 'Consumo en labor %';

WITH m AS (
    SELECT id_movimiento, id_insumo, cantidad, motivo::text AS motivo,
           row_number() OVER (PARTITION BY id_insumo, cantidad, motivo ORDER BY id_movimiento) AS n
    FROM agrocontrol.movimiento_insumo WHERE motivo LIKE 'Consumo en labor %'
), c AS (
    SELECT c.id_consumo, c.id_insumo, c.cantidad,
           'Consumo en labor ' || l.id_labor || ' (' || l.tipo || ')' AS motivo,
           row_number() OVER (PARTITION BY c.id_labor, c.id_insumo, c.cantidad ORDER BY c.id_consumo) AS n
    FROM agrocontrol.consumo_labor c JOIN agrocontrol.labor l USING (id_labor)
)
UPDATE agrocontrol.movimiento_insumo mi SET id_consumo = c.id_consumo
FROM m JOIN c USING (id_insumo, cantidad, motivo, n)
WHERE mi.id_movimiento = m.id_movimiento;

-- Una campaña cerrada no deja labores abiertas: quedarían sin ninguna acción posible.
UPDATE agrocontrol.labor l SET estado = 'CANCELADA', motivo_cancelacion = 'Campaña finalizada'
FROM agrocontrol.campana c
WHERE c.id_campana = l.id_campana AND c.estado = 'FINALIZADA' AND l.estado IN ('PLANIFICADA', 'EN_CURSO');

UPDATE agrocontrol.labor l SET estado = 'ASIGNADA'
WHERE l.estado = 'PLANIFICADA'
  AND EXISTS (SELECT 1 FROM agrocontrol.asignacion_labor a WHERE a.id_labor = l.id_labor);

-- El stock que V2 cargó sin movimientos: desde aquí, stock_actual = entradas - salidas.
INSERT INTO agrocontrol.movimiento_insumo (id_insumo, tipo, cantidad, motivo, id_usuario, origen)
SELECT d.id_insumo, CASE WHEN d.diferencia > 0 THEN 'ENTRADA' ELSE 'SALIDA' END, abs(d.diferencia), 'Saldo inicial',
       (SELECT min(u.id_usuario) FROM agrocontrol.usuario u JOIN agrocontrol.rol r USING (id_rol)
        WHERE r.nombre = 'ADMINISTRADOR'),
       'AJUSTE'
FROM (
    SELECT i.id_insumo,
           i.stock_actual - coalesce(sum(CASE m.tipo WHEN 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END), 0) AS diferencia
    FROM agrocontrol.insumo i LEFT JOIN agrocontrol.movimiento_insumo m USING (id_insumo)
    GROUP BY i.id_insumo, i.stock_actual
) d
WHERE d.diferencia <> 0;
