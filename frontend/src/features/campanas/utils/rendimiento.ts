import type { Cosecha } from '../../cosechas/models/Cosecha';
import type { Parcela } from '../../parcelas/models/Parcela';
import { sinAnulados } from '../../../shared/utils/estados';
import type { Campana } from '../models/Campana';

// Lo sembrado de verdad; sin ese dato, toda la parcela (igual que el backend en el avance).
export function superficie(campana: Campana, parcelas: Parcela[]): number | null {
  return campana.areaSembradaHa ?? parcelas.find((parcela) => parcela.id === campana.parcelaId)?.areaHa ?? null;
}

// Toneladas por hectárea de cada campaña con cosecha registrada.
export function rendimientos(campanas: Campana[], cosechas: Cosecha[], parcelas: Parcela[]): Record<number, number> {
  const vigentes = sinAnulados(cosechas);
  const resultado: Record<number, number> = {};
  for (const campana of campanas) {
    const area = superficie(campana, parcelas);
    const toneladas = vigentes
      .filter((cosecha) => cosecha.campanaId === campana.id)
      .reduce((suma, cosecha) => suma + cosecha.toneladas, 0);
    if (area && toneladas > 0) resultado[campana.id] = toneladas / area;
  }
  return resultado;
}
