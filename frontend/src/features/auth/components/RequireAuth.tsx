import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/useAuth';
import type { Seccion } from '../permisos';

// Sin sesión → /login, recordando a dónde quería ir. Con la clave pendiente → /cambiar-password.
export function RequireAuth() {
  const { sesion } = useAuth();
  const location = useLocation();
  if (!sesion) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (sesion.debeCambiarPassword && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }
  return <Outlet />;
}

// Con sesión pero sin permiso para la sección (p. ej. un operario que escribe /predios en la URL).
export function RequireSeccion({ seccion }: { seccion: Seccion }) {
  const { puedeVer } = useAuth();
  if (!puedeVer(seccion)) {
    return (
      <div className="state-card error" role="alert">
        Su rol no tiene acceso a esta sección.
      </div>
    );
  }
  return <Outlet />;
}
