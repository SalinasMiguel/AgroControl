-- =====================================================================
-- V2__seed_core.sql — Dataset mínimo coherente de AgroControl
-- ---------------------------------------------------------------------
-- No modifica el esquema: solo inserta datos sobre las tablas de V1.
-- Las FK se resuelven por claves naturales (nombre, email, código...)
-- con subconsultas, en lugar de ids fijos: así el script no depende de
-- en qué valor esté cada secuencia SERIAL.
-- Estados usados = los que ya maneja el código de dominio:
--   parcela: DISPONIBLE · campana: PLANIFICADA / FINALIZADA
--   labor:   PLANIFICADA / EJECUTADA
-- =====================================================================

-- ---------- ROL (entidad padre del par 1:N) ----------
INSERT INTO agrocontrol.rol (nombre, descripcion) VALUES
    ('ADMINISTRADOR', 'Gestiona usuarios, roles y configuración general'),
    ('JEFE_DE_CAMPO', 'Planifica campañas y asigna labores'),
    ('OPERARIO',      'Ejecuta labores en parcela'),
    ('ALMACENERO',    'Controla entradas y salidas de insumos'),
    ('SUPERVISOR',    'Revisa bitácora, cosechas e incidencias');

-- ---------- USUARIO (entidad dependiente: FK id_rol) ----------
-- password_hash son marcadores de demo, no hashes reales.
INSERT INTO agrocontrol.usuario (nombre, email, password_hash, id_rol, activo) VALUES
    ('Sergio Rioja',     'sergio@agrocontrol.com',     'hash-demo-001', (SELECT id_rol FROM agrocontrol.rol WHERE nombre = 'ADMINISTRADOR'), true),
    ('Marta Suárez',     'jefe@agrocontrol.com',       'hash-demo-002', (SELECT id_rol FROM agrocontrol.rol WHERE nombre = 'JEFE_DE_CAMPO'), true),
    ('Luis Choque',      'operario1@agrocontrol.com',  'hash-demo-003', (SELECT id_rol FROM agrocontrol.rol WHERE nombre = 'OPERARIO'),      true),
    ('Ana Vaca',         'operario2@agrocontrol.com',  'hash-demo-004', (SELECT id_rol FROM agrocontrol.rol WHERE nombre = 'OPERARIO'),      false),
    ('Carlos Rojas',     'almacen@agrocontrol.com',    'hash-demo-005', (SELECT id_rol FROM agrocontrol.rol WHERE nombre = 'ALMACENERO'),    true);
-- SUPERVISOR queda sin usuarios a propósito: sirve para el LEFT JOIN / IS NULL de la clase 08.

-- ---------- PREDIO ----------
INSERT INTO agrocontrol.predio (nombre, ubicacion, area_ha, activo) VALUES
    ('Fundo San José',     'Montero, Santa Cruz', 120.00, true),
    ('Fundo Las Palmeras', 'Warnes, Santa Cruz',   85.50, true),
    ('Predio El Retiro',   NULL,                   40.00, false);

-- ---------- PARCELA (FK id_predio; UNIQUE (id_predio, codigo)) ----------
INSERT INTO agrocontrol.parcela (id_predio, codigo, area_ha, estado) VALUES
    ((SELECT id_predio FROM agrocontrol.predio WHERE nombre = 'Fundo San José'),     'P-01', 45.00, 'DISPONIBLE'),
    ((SELECT id_predio FROM agrocontrol.predio WHERE nombre = 'Fundo San José'),     'P-02', 30.00, 'DISPONIBLE'),
    ((SELECT id_predio FROM agrocontrol.predio WHERE nombre = 'Fundo Las Palmeras'), 'P-01', 50.00, 'DISPONIBLE'),
    ((SELECT id_predio FROM agrocontrol.predio WHERE nombre = 'Fundo Las Palmeras'), 'P-02', NULL,  'DISPONIBLE'),
    ((SELECT id_predio FROM agrocontrol.predio WHERE nombre = 'Predio El Retiro'),   'P-01', 40.00, 'DISPONIBLE');

-- ---------- CULTIVO (UNIQUE nombre) ----------
INSERT INTO agrocontrol.cultivo (nombre, ciclo_dias) VALUES
    ('Soya',           120),
    ('Maíz',           140),
    ('Sorgo',          110),
    ('Caña de azúcar', NULL);
-- Caña de azúcar: sin ciclo cargado (IS NULL) y sin campañas (LEFT JOIN sin coincidencia).

-- ---------- CAMPANA (FK id_parcela, id_cultivo; CHECK fecha_fin >= fecha_inicio) ----------
INSERT INTO agrocontrol.campana (id_parcela, id_cultivo, fecha_inicio, fecha_fin, estado) VALUES
    ((SELECT p.id_parcela FROM agrocontrol.parcela p JOIN agrocontrol.predio pr ON pr.id_predio = p.id_predio
       WHERE pr.nombre = 'Fundo San José' AND p.codigo = 'P-01'),
     (SELECT id_cultivo FROM agrocontrol.cultivo WHERE nombre = 'Soya'),
     DATE '2026-01-10', DATE '2026-05-15', 'FINALIZADA'),
    ((SELECT p.id_parcela FROM agrocontrol.parcela p JOIN agrocontrol.predio pr ON pr.id_predio = p.id_predio
       WHERE pr.nombre = 'Fundo San José' AND p.codigo = 'P-02'),
     (SELECT id_cultivo FROM agrocontrol.cultivo WHERE nombre = 'Maíz'),
     DATE '2026-02-01', NULL, 'PLANIFICADA'),
    ((SELECT p.id_parcela FROM agrocontrol.parcela p JOIN agrocontrol.predio pr ON pr.id_predio = p.id_predio
       WHERE pr.nombre = 'Fundo Las Palmeras' AND p.codigo = 'P-01'),
     (SELECT id_cultivo FROM agrocontrol.cultivo WHERE nombre = 'Sorgo'),
     DATE '2026-06-01', NULL, 'PLANIFICADA'),
    ((SELECT p.id_parcela FROM agrocontrol.parcela p JOIN agrocontrol.predio pr ON pr.id_predio = p.id_predio
       WHERE pr.nombre = 'Fundo San José' AND p.codigo = 'P-01'),
     (SELECT id_cultivo FROM agrocontrol.cultivo WHERE nombre = 'Maíz'),
     DATE '2026-08-01', NULL, 'PLANIFICADA');

-- ---------- LABOR (FK id_campana, id_parcela: la parcela coincide con la de su campaña) ----------
INSERT INTO agrocontrol.labor (id_campana, id_parcela, tipo, fecha_plan, fecha_ejecucion, estado)
SELECT c.id_campana, c.id_parcela, v.tipo, v.fecha_plan, v.fecha_ejecucion, v.estado
FROM (VALUES
        ('Soya',  DATE '2026-01-10', 'SIEMBRA',       DATE '2026-01-10', DATE '2026-01-11', 'EJECUTADA'),
        ('Soya',  DATE '2026-01-10', 'FUMIGACION',    DATE '2026-02-20', DATE '2026-02-21', 'EJECUTADA'),
        ('Maíz',  DATE '2026-02-01', 'FERTILIZACION', DATE '2026-03-15', NULL,              'PLANIFICADA'),
        ('Sorgo', DATE '2026-06-01', 'SIEMBRA',       DATE '2026-06-02', DATE '2026-06-03', 'EJECUTADA'),
        ('Maíz',  DATE '2026-08-01', 'RIEGO',         DATE '2026-10-05', NULL,              'PLANIFICADA')
     ) AS v(cultivo, inicio, tipo, fecha_plan, fecha_ejecucion, estado)
JOIN agrocontrol.cultivo cu ON cu.nombre = v.cultivo
JOIN agrocontrol.campana c  ON c.id_cultivo = cu.id_cultivo AND c.fecha_inicio = v.inicio;

-- ---------- ASIGNACION_LABOR (N:M labor ↔ usuario; UNIQUE (id_labor, id_usuario)) ----------
-- La labor RIEGO queda sin responsable a propósito (consulta "sin coincidencia" de la clase 08).
INSERT INTO agrocontrol.asignacion_labor (id_labor, id_usuario)
SELECT l.id_labor, u.id_usuario
FROM (VALUES
        ('SIEMBRA',       DATE '2026-01-10', 'operario1@agrocontrol.com'),
        ('SIEMBRA',       DATE '2026-01-10', 'jefe@agrocontrol.com'),
        ('FUMIGACION',    DATE '2026-02-20', 'operario1@agrocontrol.com'),
        ('FERTILIZACION', DATE '2026-03-15', 'operario2@agrocontrol.com'),
        ('SIEMBRA',       DATE '2026-06-02', 'operario1@agrocontrol.com')
     ) AS v(tipo, fecha_plan, email)
JOIN agrocontrol.labor   l ON l.tipo = v.tipo AND l.fecha_plan = v.fecha_plan
JOIN agrocontrol.usuario u ON u.email = v.email;

-- ---------- INSUMO ----------
INSERT INTO agrocontrol.insumo (nombre, unidad_medida, stock_actual) VALUES
    ('Semilla de soya certificada', 'kg',  850.00),
    ('Urea 46%',                    'kg',   60.00),
    ('Glifosato 48%',               'L',    15.50);

-- ---------- COSECHA (FK id_campana, id_usuario) ----------
INSERT INTO agrocontrol.cosecha (id_campana, cantidad, unidad_medida, fecha, id_usuario) VALUES
    ((SELECT c.id_campana FROM agrocontrol.campana c JOIN agrocontrol.cultivo cu ON cu.id_cultivo = c.id_cultivo
       WHERE cu.nombre = 'Soya' AND c.fecha_inicio = DATE '2026-01-10'),
     135.00, 't', DATE '2026-05-14',
     (SELECT id_usuario FROM agrocontrol.usuario WHERE email = 'jefe@agrocontrol.com'));
