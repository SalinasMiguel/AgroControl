import { describe, expect, it } from 'vitest';
import type { Cosecha } from '../../../cosechas/models/Cosecha';
import type { Parcela } from '../../../parcelas/models/Parcela';
import type { Campana } from '../../models/Campana';
import type { Catalogos } from '../etiquetas';
import { filtrarCampanas } from '../filtrarCampanas';
import { rendimientos } from '../rendimiento';

const campana = (id: number, datos: Partial<Campana>) => ({ id, parcelaId: 1, cultivoId: 1, estado: 'EN_CURSO', ...datos }) as Campana;
const parcelas = [{ id: 1, predioId: 1, codigo: 'P-01', areaHa: 10 }] as Parcela[];
const catalogos = {
  predios: [{ id: 1, nombre: 'Fundo San José' }],
  parcelas,
  cultivos: [{ id: 1, nombre: 'Maíz' }, { id: 2, nombre: 'Soya' }],
} as Catalogos;

describe('filtrarCampanas', () => {
  const campanas = [
    campana(1, { variedad: 'DK 7500' }),
    campana(2, { cultivoId: 2, estado: 'FINALIZADA', variedad: null }),
  ];
  const todo = { busqueda: '', estado: '', cultivoId: '' } as const;

  it('busca por variedad, parcela y cultivo', () => {
    expect(filtrarCampanas(campanas, catalogos, { ...todo, busqueda: 'dk 75' }).map((c) => c.id)).toEqual([1]);
    expect(filtrarCampanas(campanas, catalogos, { ...todo, busqueda: 'san josé' })).toHaveLength(2);
    expect(filtrarCampanas(campanas, catalogos, { ...todo, busqueda: 'soya' }).map((c) => c.id)).toEqual([2]);
  });

  it('filtra por estado y por cultivo', () => {
    expect(filtrarCampanas(campanas, catalogos, { ...todo, estado: 'FINALIZADA' }).map((c) => c.id)).toEqual([2]);
    expect(filtrarCampanas(campanas, catalogos, { ...todo, cultivoId: '1' }).map((c) => c.id)).toEqual([1]);
  });
});

describe('rendimientos', () => {
  const cosecha = (campanaId: number, toneladas: number, anulado = false) => ({ campanaId, toneladas, anulado }) as Cosecha;

  it('divide entre lo sembrado y, sin ese dato, entre la parcela', () => {
    const campanas = [campana(1, { areaSembradaHa: 4 }), campana(2, { areaSembradaHa: null })];
    expect(rendimientos(campanas, [cosecha(1, 10), cosecha(2, 10)], parcelas)).toEqual({ 1: 2.5, 2: 1 });
  });

  it('ignora lo anulado y las campañas sin cosecha', () => {
    expect(rendimientos([campana(1, { areaSembradaHa: 4 })], [cosecha(1, 10, true)], parcelas)).toEqual({});
  });
});
