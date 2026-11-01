import { API_URL } from '../config/env';
import { leerSesion } from '../features/auth/services/sesionStorage';

// AuthContext se suscribe para volver al login cuando el backend responde 401 (token vencido).
let manejarSesionExpirada: (() => void) | null = null;

export function alExpirarSesion(handler: () => void) {
  manejarSesionExpirada = handler;
  return () => {
    if (manejarSesionExpirada === handler) manejarSesionExpirada = null;
  };
}

export class ApiError extends Error {
  status: number;
  campos: Record<string, string>;

  constructor(status: number, message: string, campos: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

// Forma del ProblemDetail (RFC 9457) que devuelve GlobalExceptionHandler en Spring Boot.
interface ProblemDetailBody {
  title?: string;
  detail?: string;
  errores?: Record<string, string>;
}

// Para archivos protegidos: un <img src> no puede enviar el token.
export async function apiBlob(endpoint: string, signal?: AbortSignal): Promise<Blob> {
  const token = leerSesion()?.token;
  const response = await fetch(`${API_URL}${endpoint}`, {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new ApiError(response.status, 'No se pudo abrir el archivo');
  return response.blob();
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  // Con FormData el navegador pone el Content-Type y el separador
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = leerSesion()?.token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    manejarSesionExpirada?.();
  }

  if (!response.ok) {
    const detail = await response.text();
    let body: ProblemDetailBody = {};
    try {
      body = JSON.parse(detail) as ProblemDetailBody;
    } catch {
      // El backend respondió texto plano o nada: usamos el texto tal cual.
    }
    throw new ApiError(
      response.status,
      body.detail || body.title || detail || response.statusText || 'Error HTTP',
      body.errores,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
