import { describe, expect, it } from 'vitest';
import type { Insumo } from '../../models/Insumo';
import { buscarInsumos } from '../buscarInsumos';

const insumo = (id: number, nombre: string, codigo: string | null, marca: string | null) =>
  ({ id, nombre, codigo, marca }) as Insumo;

const insumos = [
  insumo(1, 'Rodamiento de rueda', '6205-2RS1', 'SKF'),
  insumo(2, 'Filtro de aceite', '1R-0750', 'CAT'),
  insumo(3, 'Diésel', null, null),
];

describe('buscarInsumos', () => {
  it('devuelve todo sin búsqueda', () => {
    expect(buscarInsumos(insumos, '  ')).toHaveLength(3);
  });

  it('encuentra el código aunque se escriba sin guiones ni mayúsculas', () => {
    expect(buscarInsumos(insumos, '62052rs').map((i) => i.id)).toEqual([1]);
  });

  it('busca también por marca y por nombre', () => {
    expect(buscarInsumos(insumos, 'cat').map((i) => i.id)).toEqual([2]);
    expect(buscarInsumos(insumos, 'dié').map((i) => i.id)).toEqual([3]);
  });
});
