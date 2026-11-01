import { apiBlob, apiFetch } from '../../../api/apiClient';
import type { FotoIncidencia, Incidencia } from '../models/Incidencia';

export type IncidenciaCreateRequest = Pick<Incidencia, 'parcelaId' | 'campanaId' | 'laborId' | 'descripcion' | 'tipo' | 'gravedad'>;

export const incidenciaService = {
  listar(signal?: AbortSignal): Promise<Incidencia[]> {
    return apiFetch<Incidencia[]>('/incidencias', { signal });
  },

  asignarResponsable(id: number, usuarioId: number): Promise<Incidencia> {
    return apiFetch<Incidencia>(`/incidencias/${id}/responsable`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId }),
    });
  },

  listarFotos(id: number, signal?: AbortSignal): Promise<FotoIncidencia[]> {
    return apiFetch<FotoIncidencia[]>(`/incidencias/${id}/fotos`, { signal });
  },

  verFoto(id: number, fotoId: number, signal?: AbortSignal): Promise<Blob> {
    return apiBlob(`/incidencias/${id}/fotos/${fotoId}`, signal);
  },

  agregarFoto(id: number, foto: File): Promise<FotoIncidencia> {
    const cuerpo = new FormData();
    cuerpo.append('foto', foto);
    return apiFetch<FotoIncidencia>(`/incidencias/${id}/fotos`, { method: 'POST', body: cuerpo });
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
