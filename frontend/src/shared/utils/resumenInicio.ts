import type { Campana } from '../../features/campanas/models/Campana';
import type { Insumo } from '../../features/insumos/models/Insumo';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Fechas ISO (yyyy-mm-dd): se comparan como días, sin que la hora o la zona las corran.
export function diasAtraso(fechaIso: string, hoy: string): number {
  const dias = (Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${fechaIso}T00:00:00Z`)) / MS_POR_DIA;
  return Math.max(0, Math.round(dias));
}

const proporcion = (insumo: Insumo) => (insumo.stockMinimo > 0 ? insumo.stockActual / insumo.stockMinimo : 0);

export function insumosPorReponer(insumos: Insumo[]): Insumo[] {
  return insumos
    .filter((insumo) => insumo.porAgotarse || insumo.stockActual <= 0)
    .sort((a, b) => proporcion(a) - proporcion(b));
}

export function siembrasAtrasadas(campanas: Campana[], hoy: string): number {
  return campanas.filter((campana) => campana.estado === 'PLANIFICADA' && campana.fechaInicio < hoy).length;
}
