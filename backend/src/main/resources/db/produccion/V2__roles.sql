-- V2__roles.sql — Instalación real: solo los 5 roles, sin datos de ejemplo.

INSERT INTO agrocontrol.rol (nombre, descripcion) VALUES
    ('ADMINISTRADOR', 'Gestiona usuarios, roles y configuración general'),
    ('JEFE_DE_CAMPO', 'Planifica campañas y asigna labores'),
    ('OPERARIO',      'Ejecuta labores en parcela'),
    ('ALMACENERO',    'Controla entradas y salidas de insumos'),
    ('SUPERVISOR',    'Revisa bitácora, cosechas e incidencias');
