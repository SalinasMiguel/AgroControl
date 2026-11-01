-- V10__datos_veraces.sql — Unidades de cosecha normalizadas (RN-07) y parcelas alineadas con sus campañas.
-- Si queda una unidad desconocida, la migración falla: no hay forma segura de convertirla.

UPDATE agrocontrol.cosecha SET unidad_medida = CASE lower(trim(unidad_medida))
    WHEN 'ton' THEN 't' WHEN 'tn' THEN 't' WHEN 'tonelada' THEN 't' WHEN 'toneladas' THEN 't'
    WHEN 'kilo' THEN 'kg' WHEN 'kilos' THEN 'kg' WHEN 'kilogramo' THEN 'kg' WHEN 'kilogramos' THEN 'kg'
    WHEN 'quintal' THEN 'qq' WHEN 'quintales' THEN 'qq'
    ELSE lower(trim(unidad_medida))
END;

ALTER TABLE agrocontrol.cosecha
    ADD CONSTRAINT cosecha_unidad_check CHECK (unidad_medida IN ('t', 'kg', 'qq'));

UPDATE agrocontrol.parcela p SET estado = 'EN_PRODUCCION'
WHERE EXISTS (SELECT 1 FROM agrocontrol.campana c WHERE c.id_parcela = p.id_parcela AND c.estado = 'EN_CURSO');

UPDATE agrocontrol.parcela p SET estado = 'DISPONIBLE'
WHERE p.estado = 'EN_PRODUCCION'
  AND NOT EXISTS (SELECT 1 FROM agrocontrol.campana c WHERE c.id_parcela = p.id_parcela AND c.estado = 'EN_CURSO');
