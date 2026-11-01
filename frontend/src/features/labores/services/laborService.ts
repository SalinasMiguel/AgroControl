import { apiFetch } from '../../../api/apiClient';
import type { AsignacionLabor, ConsumoLabor, Labor } from '../models/Labor';

export type LaborCreateRequest = Pick<Labor, 'campanaId' | 'tipo' | 'fechaPlan'>;

export interface ConsumoRequest {
  insumoId: number;
  cantidad: number;
}

export const laborService = {
  listar(signal?: AbortSignal): Promise<Labor[]> {
    return apiFetch<Labor[]>('/labores', { signal });
  },

  planificar(data: LaborCreateRequest): Promise<Labor> {
    return apiFetch<Labor>('/labores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  iniciar(id: number): Promise<Labor> {
    return apiFetch<Labor>(`/labores/${id}/iniciar`, { method: 'POST' });
  },

  ejecutar(id: number, fechaEjecucion: string): Promise<Labor> {
    return apiFetch<Labor>(`/labores/${id}/ejecutar`, {
      method: 'POST',
      body: JSON.stringify({ fechaEjecucion }),
    });
  },

  editar(id: number, data: Pick<Labor, 'tipo' | 'fechaPlan'>): Promise<Labor> {
    return apiFetch<Labor>(`/labores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancelar(id: number, motivo: string): Promise<Labor> {
    return apiFetch<Labor>(`/labores/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  reabrir(id: number, motivo: string): Promise<Labor> {
    return apiFetch<Labor>(`/labores/${id}/reabrir`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  anularConsumo(laborId: number, consumoId: number, motivo: string): Promise<ConsumoLabor> {
    return apiFetch<ConsumoLabor>(`/labores/${laborId}/consumos/${consumoId}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  listarAsignaciones(signal?: AbortSignal): Promise<AsignacionLabor[]> {
    return apiFetch<AsignacionLabor[]>('/labores/asignaciones', { signal });
  },

  asignar(laborId: number, usuarioId: number): Promise<AsignacionLabor> {
    return apiFetch<AsignacionLabor>(`/labores/${laborId}/asignaciones`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId }),
    });
  },

  listarConsumos(laborId: number, signal?: AbortSignal): Promise<ConsumoLabor[]> {
    return apiFetch<ConsumoLabor[]>(`/labores/${laborId}/consumos`, { signal });
  },

  registrarConsumo(laborId: number, data: ConsumoRequest): Promise<ConsumoLabor> {
    return apiFetch<ConsumoLabor>(`/labores/${laborId}/consumos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
