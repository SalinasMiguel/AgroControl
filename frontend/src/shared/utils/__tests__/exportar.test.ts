import { describe, expect, it } from 'vitest';
import { aCsv, nombreArchivo } from '../exportar';

const columnas = [
  { titulo: 'Nombre', valor: (f: { n: string; c: number | null }) => f.n },
  { titulo: 'Cantidad', valor: (f: { n: string; c: number | null }) => f.c },
];

describe('aCsv', () => {
  it('usa punto y coma, coma decimal y BOM', () => {
    expect(aCsv(columnas, [{ n: 'Soya', c: 2.5 }])).toBe('﻿Nombre;Cantidad\r\nSoya;2,5');
  });

  it('entrecomilla lo que rompería la fila y deja vacío lo nulo', () => {
    expect(aCsv(columnas, [{ n: 'a;"b"', c: null }])).toContain('"a;""b""";');
  });

  it('desactiva las fórmulas en los textos', () => {
    expect(aCsv(columnas, [{ n: '=HYPERLINK("x")', c: 1 }])).toContain(`"'=HYPERLINK(""x"")"`);
  });
});

it('el nombre del archivo no lleva tildes ni espacios', () => {
  expect(nombreArchivo('Campañas en curso', '2026-11-01')).toBe('agrocontrol-campanas-en-curso-2026-11-01.csv');
});
