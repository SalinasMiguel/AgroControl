import { describe, expect, it } from 'vitest';
import { campanaAbierta, incidenciaAbierta, laborPendiente, sinAnulados } from '../estados';

describe('estados', () => {
  it('campanaAbierta solo en PLANIFICADA y EN_CURSO', () => {
    expect(campanaAbierta({ estado: 'PLANIFICADA' })).toBe(true);
    expect(campanaAbierta({ estado: 'EN_CURSO' })).toBe(true);
    expect(campanaAbierta({ estado: 'FINALIZADA' })).toBe(false);
    expect(campanaAbierta({ estado: 'CANCELADA' })).toBe(false);
    expect(campanaAbierta({ estado: 'PERDIDA' })).toBe(false);
  });

  it('laborPendiente solo en PLANIFICADA, ASIGNADA y EN_CURSO', () => {
    expect(laborPendiente({ estado: 'PLANIFICADA' })).toBe(true);
    expect(laborPendiente({ estado: 'ASIGNADA' })).toBe(true);
    expect(laborPendiente({ estado: 'EN_CURSO' })).toBe(true);
    expect(laborPendiente({ estado: 'EJECUTADA' })).toBe(false);
    expect(laborPendiente({ estado: 'CANCELADA' })).toBe(false);
  });

  it('incidenciaAbierta solo en ABIERTA y EN_ATENCION', () => {
    expect(incidenciaAbierta({ estado: 'ABIERTA' })).toBe(true);
    expect(incidenciaAbierta({ estado: 'EN_ATENCION' })).toBe(true);
    expect(incidenciaAbierta({ estado: 'RESUELTA' })).toBe(false);
    expect(incidenciaAbierta({ estado: 'ANULADA' })).toBe(false);
  });

  it('sinAnulados deja fuera lo anulado', () => {
    expect(sinAnulados([{ anulado: false, id: 1 }, { anulado: true, id: 2 }])).toEqual([{ anulado: false, id: 1 }]);
  });
});
