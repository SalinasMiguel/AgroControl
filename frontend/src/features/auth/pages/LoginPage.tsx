import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useCarga } from '../../../hooks/useCarga';
import { useAuth } from '../context/useAuth';
import { NOMBRE_ROL } from '../permisos';
import type { Rol } from '../models/Sesion';
import { authService } from '../services/authService';

// Usuarios de V2/V3 (contraseña agro123) para la demo de la defensa.
const USUARIOS_DEMO: { email: string; rol: Rol }[] = [
  { email: 'sergio@agrocontrol.com', rol: 'ADMINISTRADOR' },
  { email: 'jefe@agrocontrol.com', rol: 'JEFE_DE_CAMPO' },
  { email: 'operario1@agrocontrol.com', rol: 'OPERARIO' },
  { email: 'almacen@agrocontrol.com', rol: 'ALMACENERO' },
  { email: 'supervisor@agrocontrol.com', rol: 'SUPERVISOR' },
];

export default function LoginPage() {
  const { sesion, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { datos: demo } = useCarga(authService.demo, false);

  if (sesion) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Ingrese email y contraseña.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await iniciarSesion(email.trim(), password);
      const desde = (location.state as { desde?: string } | null)?.desde ?? '/';
      navigate(desde, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="sidebar__brand login-card__brand">
          <span className="sidebar__brand-mark">A</span>
          <div>
            <strong>AgroControl</strong>
            <small>Gestión agrícola</small>
          </div>
        </div>
        <h1>Iniciar sesión</h1>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>

        {demo && (
          <div className="login-demo">
            <p className="muted">Usuarios de prueba (contraseña <code>agro123</code>):</p>
            <div className="login-demo__list">
              {USUARIOS_DEMO.map((usuario) => (
                <button
                  key={usuario.email}
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setEmail(usuario.email);
                    setPassword('agro123');
                    setError('');
                  }}
                >
                  {NOMBRE_ROL[usuario.rol]}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
