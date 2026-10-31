import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { alExpirarSesion } from '../../../api/apiClient';
import type { Sesion } from '../models/Sesion';
import { puede, puedeVer } from '../permisos';
import { authService } from '../services/authService';
import { guardarSesion, leerSesion } from '../services/sesionStorage';
import { AuthContext, type AuthContextValue } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);

  const cerrarSesion = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
  }, []);

  // Token vencido o inválido (401 en cualquier request): se vuelve al login.
  useEffect(() => alExpirarSesion(cerrarSesion), [cerrarSesion]);

  // Al recargar, se confirma con el backend que el usuario sigue activo y con el mismo rol.
  useEffect(() => {
    if (!leerSesion()) return;
    const controller = new AbortController();
    authService
      .yo(controller.signal)
      .then((actual) => {
        guardarSesion(actual);
        setSesion(actual);
      })
      .catch(() => {
        // 401 ya lo maneja alExpirarSesion; un error de red deja la sesión guardada.
      });
    return () => controller.abort();
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const nueva = await authService.login(email, password);
    guardarSesion(nueva);
    setSesion(nueva);
    return nueva;
  }, []);

  // Cambiar la clave invalida el token anterior: se guarda la sesión nueva sin pasar por el login.
  const actualizarSesion = useCallback((nueva: Sesion) => {
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({
      sesion,
      iniciarSesion,
      cerrarSesion,
      actualizarSesion,
      puede: (accion) => (sesion ? puede(sesion.rol, accion) : false),
      puedeVer: (seccion) => (sesion ? puedeVer(sesion.rol, seccion) : false),
    }),
    [sesion, iniciarSesion, cerrarSesion, actualizarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
