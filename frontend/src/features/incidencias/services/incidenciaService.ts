import { apiFetch } from '../../../api/apiClient';
import type { Incidencia } from '../models/Incidencia';

export type IncidenciaCreateRequest = Pick<Incidencia, 'parcelaId' | 'campanaId' | 'laborId' | 'descripcion' | 'tipo' | 'gravedad'>;

export const incidenciaService = {
  listar(signal?: AbortSignal): Promise<Incidencia[]> {
    return apiFetch<Incidencia[]>('/incidencias', { signal });
  },

  atender(id: number): Promise<Incidencia> {
    return apiFetch<Incidencia>(`/incidencias/${id}/atender`, { method: 'POST' });
  },

  resolver(id: number, resolucion: string): Promise<Incidencia> {
    return apiFetch<Incidencia>(`/incidencias/${id}/resolver`, {
      method: 'POST',
      body: JSON.stringify({ resolucion }),
    });
  },

  anular(id: number, motivo: string): Promise<Incidencia> {
    return apiFetch<Incidencia>(`/incidencias/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  registrar(data: IncidenciaCreateRequest): Promise<Incidencia> {
    return apiFetch<Incidencia>('/incidencias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
