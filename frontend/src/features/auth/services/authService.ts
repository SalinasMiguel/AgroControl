import { apiFetch } from '../../../api/apiClient';
import type { Sesion } from '../models/Sesion';

export const authService = {
  login(email: string, password: string): Promise<Sesion> {
    return apiFetch<Sesion>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  cambiarPassword(passwordActual: string, passwordNueva: string): Promise<Sesion> {
    return apiFetch<Sesion>('/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
  },

  // Una instalación real responde demo = false y el login oculta los usuarios de prueba.
  async demo(signal?: AbortSignal): Promise<boolean> {
    const salud = await apiFetch<{ demo?: boolean }>('/health', { signal });
    return salud.demo === true;
  },

  yo(signal?: AbortSignal): Promise<Sesion> {
    return apiFetch<Sesion>('/auth/me', { signal });
  },
};
