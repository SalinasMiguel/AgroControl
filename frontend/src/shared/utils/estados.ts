// Una sola definición de "abierto" y "pendiente" para todas las pantallas.
export const campanaAbierta = (campana: { estado: string }) =>
  campana.estado === 'PLANIFICADA' || campana.estado === 'EN_CURSO';

export const laborPendiente = (labor: { estado: string }) =>
  labor.estado === 'PLANIFICADA' || labor.estado === 'ASIGNADA' || labor.estado === 'EN_CURSO';

export const incidenciaAbierta = (incidencia: { estado: string }) =>
  incidencia.estado === 'ABIERTA' || incidencia.estado === 'EN_ATENCION';

export function sinAnulados<T extends { anulado: boolean }>(lista: T[]): T[] {
  return lista.filter((item) => !item.anulado);
}
