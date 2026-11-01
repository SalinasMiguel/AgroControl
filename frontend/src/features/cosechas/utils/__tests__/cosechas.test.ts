import { describe, expect, it } from 'vitest';
import type { Cosecha } from '../../models/Cosecha';
import { filtrarCosechas, totalesPorUnidad } from '../filtrarCosechas';
import { toneladasNetas } from '../neto';

const cosecha = (c: Partial<Cosecha>) => ({ toneladas: 10, humedadPct: null, impurezasPct: null, cantidad: 10, unidadMedida: 't', campanaId: 1, fecha: '2026-10-10', numeroBoleta: null, ...c }) as Cosecha;

describe('toneladasNetas', () => {
  it('coincide con el backend', () => {
    expect(toneladasNetas(cosecha({ humedadPct: 20 }), 13)).toBeCloseTo(9.195402, 5);
    expect(toneladasNetas(cosecha({ humedadPct: 10 }), 13)).toBe(10);
    expect(toneladasNetas(cosecha({ humedadPct: 20, impurezasPct: 2 }), null)).toBeCloseTo(9.8);
  });
});

describe('filtrarCosechas', () => {
  const vacio = { busqueda: '', campanaId: '', parcelaId: '', desde: '', hasta: '' };
  it('filtra por rango de fechas inclusive', () => {
    const lista = [cosecha({ id: 1, fecha: '2026-10-01' }), cosecha({ id: 2, fecha: '2026-10-05' }), cosecha({ id: 3, fecha: '2026-10-09' })];
    const r = filtrarCosechas(lista, { ...vacio, desde: '2026-10-05', hasta: '2026-10-09' }, () => 1, () => '');
    expect(r.map((c) => c.id)).toEqual([2, 3]);
  });

  it('filtra por parcela usando la campaña', () => {
    const lista = [cosecha({ id: 1, campanaId: 1 }), cosecha({ id: 2, campanaId: 2 })];
    expect(filtrarCosechas(lista, { ...vacio, parcelaId: '7' }, (c) => (c.campanaId === 2 ? 7 : 8), () => '').map((c) => c.id)).toEqual([2]);
  });
});

it('suma por unidad sin mezclarlas', () => {
  expect(totalesPorUnidad([cosecha({ cantidad: 5 }), cosecha({ cantidad: 3 }), cosecha({ cantidad: 100, unidadMedida: 'kg' })]))
    .toEqual([{ unidad: 't', total: 8 }, { unidad: 'kg', total: 100 }]);
});
