import type { Campana, EstadoCampana } from '../models/Campana';
import { etiquetaParcela, nombreCultivo, type Catalogos } from './etiquetas';

export interface FiltroCampanas {
  busqueda: string;
  estado: EstadoCampana | '';
  cultivoId: string;
}

export function filtrarCampanas(campanas: Campana[], catalogos: Catalogos, filtro: FiltroCampanas): Campana[] {
  const buscado = filtro.busqueda.trim().toLowerCase();
  return campanas.filter((campana) => {
    if (filtro.estado && campana.estado !== filtro.estado) return false;
    if (filtro.cultivoId && String(campana.cultivoId) !== filtro.cultivoId) return false;
    if (!buscado) return true;
    const texto = [etiquetaParcela(campana.parcelaId, catalogos), nombreCultivo(campana.cultivoId, catalogos), campana.variedad ?? ''];
    return texto.some((campo) => campo.toLowerCase().includes(buscado));
  });
}
