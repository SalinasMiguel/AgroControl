import { coincideBusqueda } from '../../../shared/utils/texto';
import type { Cosecha } from '../models/Cosecha';

export interface FiltrosCosecha {
  busqueda: string;
  campanaId: string;
  parcelaId: string;
  desde: string;
  hasta: string;
}

export function filtrarCosechas(lista: Cosecha[], f: FiltrosCosecha, parcelaDe: (c: Cosecha) => number | undefined, textoDe: (c: Cosecha) => string): Cosecha[] {
  return lista.filter((cosecha) =>
    (!f.campanaId || cosecha.campanaId === Number(f.campanaId))
    && (!f.parcelaId || parcelaDe(cosecha) === Number(f.parcelaId))
    && (!f.desde || cosecha.fecha >= f.desde)
    && (!f.hasta || cosecha.fecha <= f.hasta)
    && coincideBusqueda(f.busqueda, cosecha.numeroBoleta, textoDe(cosecha)));
}

// Totales por unidad tal como se cargaron: la balanza entrega en kg y el acopio en qq.
export function totalesPorUnidad(lista: Cosecha[]): { unidad: string; total: number }[] {
  const totales = new Map<string, number>();
  lista.forEach((c) => totales.set(c.unidadMedida, (totales.get(c.unidadMedida) ?? 0) + c.cantidad));
  return [...totales].map(([unidad, total]) => ({ unidad, total }));
}
