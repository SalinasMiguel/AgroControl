import { createContext, useContext } from 'react';
import type { Sesion } from '../models/Sesion';
import type { Accion, Seccion } from '../permisos';

export interface AuthContextValue {
  sesion: Sesion | null;
  iniciarSesion: (email: string, password: string) => Promise<Sesion>;
  cerrarSesion: () => void;
  actualizarSesion: (sesion: Sesion) => void;
  puede: (accion: Accion) => boolean;
  puedeVer: (seccion: Seccion) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}

// Para páginas que solo se muestran con sesión iniciada (dentro de RequireAuth).
export function useSesion(): Sesion {
  const { sesion } = useAuth();
  if (!sesion) throw new Error('useSesion requiere una sesión iniciada');
  return sesion;
}
