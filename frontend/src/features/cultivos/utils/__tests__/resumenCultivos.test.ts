import { expect, it } from 'vitest';
import type { Campana } from '../../../campanas/models/Campana';
import type { Cosecha } from '../../../cosechas/models/Cosecha';
import type { Cultivo } from '../../models/Cultivo';
import { resumenPorCultivo } from '../resumenCultivos';

const cultivos = [{ id: 1, nombre: 'Soya', cicloDias: 120, humedadEstandarPct: null }, { id: 2, nombre: 'Maíz', cicloDias: 140, humedadEstandarPct: null }] as Cultivo[];
const campana = (id: number, cultivoId: number, estado: string, areaSembradaHa: number) => ({ id, cultivoId, parcelaId: 1, estado, areaSembradaHa }) as Campana;
const cosecha = (campanaId: number, toneladas: number) => ({ campanaId, toneladas, humedadPct: null, impurezasPct: null, anulado: false }) as Cosecha;

it('pondera el rendimiento por superficie y solo cuenta lo sembrado en curso', () => {
  const campanas = [campana(1, 1, 'FINALIZADA', 10), campana(2, 1, 'FINALIZADA', 30), campana(3, 1, 'EN_CURSO', 5)];
  const resumen = resumenPorCultivo(cultivos, campanas, [cosecha(1, 10), cosecha(2, 90)], []).get(1);
  expect(resumen).toEqual({ campanas: 3, enCurso: 1, hectareasEnCurso: 5, rendimiento: 2.5 });
});

it('un cultivo sin campañas queda en cero y sin rendimiento', () => {
  expect(resumenPorCultivo(cultivos, [], [], []).get(2)).toEqual({ campanas: 0, enCurso: 0, hectareasEnCurso: 0, rendimiento: null });
});
