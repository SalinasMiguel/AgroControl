import { apiFetch } from '../../../api/apiClient';
import type { AvanceCampana } from '../models/AvanceCampana';
import type { Campana } from '../models/Campana';

export type CampanaCreateRequest = Pick<Campana, 'parcelaId' | 'cultivoId' | 'fechaInicio'>;

export const campanaService = {
  avance(id: number, signal?: AbortSignal): Promise<AvanceCampana> {
    return apiFetch<AvanceCampana>(`/campanas/${id}/avance`, { signal });
  },

  listar(signal?: AbortSignal): Promise<Campana[]> {
    return apiFetch<Campana[]>('/campanas', { signal });
  },

  crear(data: CampanaCreateRequest): Promise<Campana> {
    return apiFetch<Campana>('/campanas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  iniciar(id: number): Promise<Campana> {
    return apiFetch<Campana>(`/campanas/${id}/iniciar`, { method: 'POST' });
  },

  finalizar(id: number, fechaFin: string): Promise<Campana> {
    return apiFetch<Campana>(`/campanas/${id}/finalizar`, {
      method: 'POST',
      body: JSON.stringify({ fechaFin }),
    });
  },

  editar(id: number, data: Pick<Campana, 'cultivoId' | 'fechaInicio'>): Promise<Campana> {
    return apiFetch<Campana>(`/campanas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancelar(id: number, motivo: string): Promise<Campana> {
    return apiFetch<Campana>(`/campanas/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  marcarPerdida(id: number, motivo: string, fechaFin: string): Promise<Campana> {
    return apiFetch<Campana>(`/campanas/${id}/marcar-perdida`, {
      method: 'POST',
      body: JSON.stringify({ motivo, fechaFin }),
    });
  },

  reabrir(id: number, motivo: string): Promise<Campana> {
    return apiFetch<Campana>(`/campanas/${id}/reabrir`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },
};
