import { describe, expect, it } from 'vitest';
import { esAnulable, type MovimientoInsumo, type OrigenMovimiento } from '../models/Insumo';

const movimiento = (origen: OrigenMovimiento, anulado = false): MovimientoInsumo => ({
  id: 1, insumoId: 1, tipo: 'SALIDA', cantidad: 1, motivo: null, usuarioId: 1, fecha: '2026-01-01T00:00:00',
  origen, anulado, motivoAnulacion: null, anuladoPor: null, anuladoEn: null,
});

describe('esAnulable', () => {
  it('MANUAL y AJUSTE sin anular; nunca CONSUMO ni ANULACION', () => {
    expect(esAnulable(movimiento('MANUAL'))).toBe(true);
    expect(esAnulable(movimiento('AJUSTE'))).toBe(true);
    expect(esAnulable(movimiento('MANUAL', true))).toBe(false);
    expect(esAnulable(movimiento('CONSUMO'))).toBe(false);
    expect(esAnulable(movimiento('ANULACION'))).toBe(false);
  });
});
