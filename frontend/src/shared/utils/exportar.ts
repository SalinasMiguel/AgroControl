export interface ColumnaExportar<T> {
  titulo: string;
  valor: (fila: T) => string | number | null | undefined;
}

// Un texto que empieza con estos signos, Excel lo ejecutaría como fórmula.
const PELIGROSO = /^[=+\-@\t\r]/;

function celda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number') return String(valor).replace('.', ',');
  const texto = PELIGROSO.test(valor) ? `'${valor}` : valor;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Excel en español separa con punto y coma; el BOM hace que respete tildes y eñes.
export function aCsv<T>(columnas: ColumnaExportar<T>[], filas: T[]): string {
  const lineas = [columnas.map((c) => celda(c.titulo)), ...filas.map((fila) => columnas.map((c) => celda(c.valor(fila))))];
  return `﻿${lineas.map((linea) => linea.join(';')).join('\r\n')}`;
}

export const nombreArchivo = (titulo: string, hoy: string) =>
  `agrocontrol-${titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${hoy}.csv`;

export function descargarCsv(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
