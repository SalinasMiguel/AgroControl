import { describe, expect, it } from 'vitest';
import type { Campana } from '../../../features/campanas/models/Campana';
import type { Insumo } from '../../../features/insumos/models/Insumo';
import { diasAtraso, insumosPorReponer, siembrasAtrasadas } from '../resumenInicio';

const insumo = (id: number, stockActual: number, stockMinimo: number, porAgotarse: boolean) =>
  ({ id, nombre: `I${id}`, unidadMedida: 'kg', categoria: 'OTRO', stockActual, stockMinimo, porAgotarse }) as Insumo;

const campana = (estado: Campana['estado'], fechaInicio: string) =>
  ({ id: 1, parcelaId: 1, cultivoId: 1, fechaInicio, fechaFin: null, estado, motivoCierre: null }) as Campana;

describe('resumenInicio', () => {
  it('diasAtraso: ayer 1, hoy 0, mañana 0', () => {
    expect(diasAtraso('2026-10-30', '2026-10-31')).toBe(1);
    expect(diasAtraso('2026-10-31', '2026-10-31')).toBe(0);
    expect(diasAtraso('2026-11-01', '2026-10-31')).toBe(0);
  });

  it('insumosPorReponer incluye porAgotarse y stock 0, sin los demás', () => {
    const lista = insumosPorReponer([insumo(1, 50, 10, false), insumo(2, 5, 10, true), insumo(3, 0, 0, false)]);
    expect(lista.map((i) => i.id).sort()).toEqual([2, 3]);
  });

  it('insumosPorReponer ordena por stockActual / stockMinimo; sin mínimo cuenta 0', () => {
    const lista = insumosPorReponer([insumo(1, 9, 10, true), insumo(2, 1, 10, true), insumo(3, 0, 0, false)]);
    expect(lista.map((i) => i.id)).toEqual([3, 2, 1]);
  });

  it('siembrasAtrasadas cuenta solo planificadas con inicio anterior a hoy', () => {
    expect(siembrasAtrasadas([
      campana('PLANIFICADA', '2026-10-30'),
      campana('PLANIFICADA', '2026-10-31'),
      campana('EN_CURSO', '2026-10-01'),
    ], '2026-10-31')).toBe(1);
  });
});
