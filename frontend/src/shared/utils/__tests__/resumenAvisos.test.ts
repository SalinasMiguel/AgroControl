import { expect, it } from 'vitest';
import type { Campana } from '../../../features/campanas/models/Campana';
import type { Incidencia } from '../../../features/incidencias/models/Incidencia';
import type { Labor } from '../../../features/labores/models/Labor';
import { cosechasPorVenir, incidenciasGraves, laboresAtrasadas } from '../resumenInicio';

const hoy = '2026-11-01';

it('solo avisa de incidencias graves sin cerrar', () => {
  const lista = [
    { id: 1, gravedad: 'ALTA', estado: 'ABIERTA' },
    { id: 2, gravedad: 'ALTA', estado: 'RESUELTA' },
    { id: 3, gravedad: 'MEDIA', estado: 'ABIERTA' },
  ] as Incidencia[];
  expect(incidenciasGraves(lista).map((i) => i.id)).toEqual([1]);
});

it('una labor de hoy o ya ejecutada no está atrasada', () => {
  const lista = [
    { id: 1, estado: 'PLANIFICADA', fechaPlan: '2026-10-30' },
    { id: 2, estado: 'PLANIFICADA', fechaPlan: hoy },
    { id: 3, estado: 'EJECUTADA', fechaPlan: '2026-10-01' },
  ] as Labor[];
  expect(laboresAtrasadas(lista, hoy).map((l) => l.id)).toEqual([1]);
});

it('avisa de cosechas dentro de 14 días o ya pasadas, solo en campañas abiertas', () => {
  const lista = [
    { id: 1, estado: 'EN_CURSO', fechaCosechaEstimada: '2026-11-15' },
    { id: 2, estado: 'EN_CURSO', fechaCosechaEstimada: '2026-11-16' },
    { id: 3, estado: 'EN_CURSO', fechaCosechaEstimada: '2026-10-20' },
    { id: 4, estado: 'FINALIZADA', fechaCosechaEstimada: '2026-11-02' },
    { id: 5, estado: 'EN_CURSO', fechaCosechaEstimada: null },
  ] as Campana[];
  expect(cosechasPorVenir(lista, hoy).map((c) => c.id)).toEqual([3, 1]);
});
