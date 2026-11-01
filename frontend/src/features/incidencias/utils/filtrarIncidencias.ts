import { incidenciaAbierta } from '../../../shared/utils/estados';
import { coincideBusqueda } from '../../../shared/utils/texto';
import type { Incidencia } from '../models/Incidencia';

export interface FiltrosIncidencia {
  busqueda: string;
  estado: string;
  gravedad: string;
  tipo: string;
  parcelaId: string;
}

const PESO = { ALTA: 0, MEDIA: 1, BAJA: 2 };

// Primero lo abierto, y dentro de eso lo más grave; a igualdad, lo más reciente.
export function ordenarIncidencias(lista: Incidencia[]): Incidencia[] {
  return [...lista].sort((a, b) =>
    Number(incidenciaAbierta(b)) - Number(incidenciaAbierta(a))
    || PESO[a.gravedad] - PESO[b.gravedad]
    || b.fecha.localeCompare(a.fecha));
}

export function filtrarIncidencias(lista: Incidencia[], filtros: FiltrosIncidencia, textoDe: (i: Incidencia) => string[]): Incidencia[] {
  return ordenarIncidencias(lista.filter((incidencia) =>
    (!filtros.estado || incidencia.estado === filtros.estado)
    && (!filtros.gravedad || incidencia.gravedad === filtros.gravedad)
    && (!filtros.tipo || incidencia.tipo === filtros.tipo)
    && (!filtros.parcelaId || incidencia.parcelaId === Number(filtros.parcelaId))
    && coincideBusqueda(filtros.busqueda, incidencia.descripcion, incidencia.resolucion, ...textoDe(incidencia))));
}
