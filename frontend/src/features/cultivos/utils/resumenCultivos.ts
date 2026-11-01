import type { Campana } from '../../campanas/models/Campana';
import { rendimientos, superficie } from '../../campanas/utils/rendimiento';
import type { Cosecha } from '../../cosechas/models/Cosecha';
import type { Parcela } from '../../parcelas/models/Parcela';
import type { Cultivo } from '../models/Cultivo';

export interface ResumenCultivo {
  campanas: number;
  enCurso: number;
  hectareasEnCurso: number;
  // t/ha ponderado por superficie, solo con las campañas que tienen cosecha
  rendimiento: number | null;
}

export function resumenPorCultivo(cultivos: Cultivo[], campanas: Campana[], cosechas: Cosecha[], parcelas: Parcela[]): Map<number, ResumenCultivo> {
  const porCampana = rendimientos(campanas, cosechas, parcelas, cultivos);
  return new Map(cultivos.map((cultivo) => {
    const propias = campanas.filter((campana) => campana.cultivoId === cultivo.id);
    const enCurso = propias.filter((campana) => campana.estado === 'EN_CURSO');
    const conCosecha = propias.filter((campana) => porCampana[campana.id] !== undefined);
    const area = conCosecha.reduce((suma, campana) => suma + (superficie(campana, parcelas) ?? 0), 0);
    const toneladas = conCosecha.reduce((suma, campana) => suma + porCampana[campana.id] * (superficie(campana, parcelas) ?? 0), 0);
    return [cultivo.id, {
      campanas: propias.length,
      enCurso: enCurso.length,
      hectareasEnCurso: enCurso.reduce((suma, campana) => suma + (superficie(campana, parcelas) ?? 0), 0),
      rendimiento: area > 0 ? toneladas / area : null,
    }];
  }));
}
