import { apiFetch } from '../../../api/apiClient';
import type { Cosecha } from '../models/Cosecha';

// usuarioId no se envía: el backend lo toma del token
export type CosechaCreateRequest = Pick<Cosecha, 'campanaId' | 'cantidad' | 'unidadMedida' | 'fecha'>;

export const cosechaService = {
  listar(signal?: AbortSignal): Promise<Cosecha[]> {
    return apiFetch<Cosecha[]>('/cosechas', { signal });
  },

  registrar(data: CosechaCreateRequest): Promise<Cosecha> {
    return apiFetch<Cosecha>('/cosechas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  anular(id: number, motivo: string): Promise<Cosecha> {
    return apiFetch<Cosecha>(`/cosechas/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },
};
