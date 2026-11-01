import { describe, expect, it } from 'vitest';
import type { Incidencia } from '../../models/Incidencia';
import { filtrarIncidencias, ordenarIncidencias } from '../filtrarIncidencias';

const inc = (id: number, c: Partial<Incidencia>) => ({
  id, estado: 'ABIERTA', gravedad: 'MEDIA', tipo: 'OTRO', parcelaId: 1, fecha: '2026-10-01T10:00:00', descripcion: 'x', resolucion: null, ...c,
}) as Incidencia;
const sinFiltros = { busqueda: '', estado: '', gravedad: '', tipo: '', parcelaId: '' };

describe('incidencias', () => {
  it('pone arriba lo abierto y grave', () => {
    const lista = [inc(1, { estado: 'RESUELTA', gravedad: 'ALTA' }), inc(2, { gravedad: 'BAJA' }), inc(3, { gravedad: 'ALTA' })];
    expect(ordenarIncidencias(lista).map((i) => i.id)).toEqual([3, 2, 1]);
  });

  it('combina filtros y busca también en los textos que recibe', () => {
    const lista = [inc(1, { tipo: 'PLAGA' }), inc(2, { tipo: 'CLIMA' })];
    expect(filtrarIncidencias(lista, { ...sinFiltros, tipo: 'CLIMA' }, () => []).map((i) => i.id)).toEqual([2]);
    expect(filtrarIncidencias(lista, { ...sinFiltros, busqueda: 'norte' }, (i) => (i.id === 1 ? ['Lote Norte'] : [])).map((i) => i.id)).toEqual([1]);
  });
});
