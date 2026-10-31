import { apiFetch } from '../../../api/apiClient';
import type { Cultivo } from '../models/Cultivo';

export type CultivoRequest = Omit<Cultivo, 'id'>;

export const cultivoService = {
  listar(signal?: AbortSignal): Promise<Cultivo[]> {
    return apiFetch<Cultivo[]>('/cultivos', { signal });
  },

  crear(data: CultivoRequest): Promise<Cultivo> {
    return apiFetch<Cultivo>('/cultivos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  actualizar(id: number, data: CultivoRequest): Promise<Cultivo> {
    return apiFetch<Cultivo>(`/cultivos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
