import { apiFetch } from '../../../api/apiClient';
import type { Usuario } from '../models/Usuario';

export interface UsuarioCreateRequest {
  rolId: number;
  nombreCompleto: string;
  email: string;
  password: string;
}

export type UsuarioUpdateRequest = Omit<UsuarioCreateRequest, 'password'>;

export const usuarioService = {
  listar(signal?: AbortSignal): Promise<Usuario[]> {
    return apiFetch<Usuario[]>('/usuarios', { signal });
  },

  crear(data: UsuarioCreateRequest): Promise<Usuario> {
    return apiFetch<Usuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  actualizar(id: number, data: UsuarioUpdateRequest): Promise<Usuario> {
    return apiFetch<Usuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  desactivar(id: number): Promise<Usuario> {
    return apiFetch<Usuario>(`/usuarios/${id}/desactivar`, { method: 'POST' });
  },

  activar(id: number): Promise<Usuario> {
    return apiFetch<Usuario>(`/usuarios/${id}/activar`, { method: 'POST' });
  },

  restablecer(id: number): Promise<{ passwordTemporal: string }> {
    return apiFetch<{ passwordTemporal: string }>(`/usuarios/${id}/restablecer-password`, { method: 'POST' });
  },
};

export function nombreUsuario(usuarios: Usuario[], id: number): string {
  return usuarios.find((usuario) => usuario.id === id)?.nombreCompleto ?? `Usuario ${id}`;
}
