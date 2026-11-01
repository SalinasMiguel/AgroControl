import type { Insumo } from '../models/Insumo';

// Sin guiones ni espacios: quien lee la caja puede escribir 62052RS o 6205-2RS y es lo mismo.
const normalizar = (texto: string) => texto.toLowerCase().replace(/[\s-]/g, '');

export function buscarInsumos(insumos: Insumo[], busqueda: string): Insumo[] {
  const buscado = normalizar(busqueda);
  if (!buscado) return insumos;
  return insumos.filter((insumo) =>
    [insumo.codigo, insumo.marca, insumo.nombre].some((campo) => campo && normalizar(campo).includes(buscado)));
}
