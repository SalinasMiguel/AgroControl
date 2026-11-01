-- V12__tipo_de_incidencia_y_calidad_de_cosecha.sql — Clasifica las incidencias y registra la calidad de cada carga.
-- Las incidencias anteriores quedan como OTRO y MEDIA: no hay forma segura de deducirlo del texto.

ALTER TABLE agrocontrol.incidencia
    ADD COLUMN tipo varchar(20) NOT NULL DEFAULT 'OTRO',
    ADD COLUMN gravedad varchar(10) NOT NULL DEFAULT 'MEDIA',
    ADD CONSTRAINT incidencia_tipo_check CHECK (tipo IN
        ('PLAGA', 'ENFERMEDAD', 'MALEZA', 'CLIMA', 'MAQUINARIA', 'RIEGO', 'OTRO')),
    ADD CONSTRAINT incidencia_gravedad_check CHECK (gravedad IN ('BAJA', 'MEDIA', 'ALTA'));

ALTER TABLE agrocontrol.cosecha
    ADD COLUMN humedad_pct numeric(5,2),
    ADD COLUMN impurezas_pct numeric(5,2),
    ADD COLUMN numero_boleta varchar(30),
    ADD CONSTRAINT cosecha_humedad_check CHECK (humedad_pct BETWEEN 0 AND 100),
    ADD CONSTRAINT cosecha_impurezas_check CHECK (impurezas_pct BETWEEN 0 AND 100);
