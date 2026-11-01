import { useNavigate } from 'react-router';
import CambiarPasswordForm from '../components/CambiarPasswordForm';
import { useAuth } from '../context/useAuth';
import Button from '../../../components/ui/Button';

// Fuera de MainLayout: con la clave pendiente, el backend rechaza todo lo que el menú cargaría.
export default function CambiarPasswordPage() {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Cambiar contraseña</h1>
        {sesion?.debeCambiarPassword && (
          <p className="muted">Por seguridad, elija una contraseña propia antes de continuar.</p>
        )}
        <CambiarPasswordForm onListo={() => navigate('/', { replace: true })} />
        <Button variant="secondary" size="sm"
          type="button"
          onClick={() => {
            cerrarSesion();
            navigate('/login', { replace: true });
          }}
        >
          Salir
        </Button>
      </div>
    </div>
  );
}
