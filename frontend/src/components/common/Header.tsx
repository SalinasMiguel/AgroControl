import { useState } from 'react';
import { useNavigate } from 'react-router';
import CambiarPasswordForm from '../../features/auth/components/CambiarPasswordForm';
import { useAuth } from '../../features/auth/context/useAuth';
import { NOMBRE_ROL } from '../../features/auth/permisos';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function Header() {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [cambiandoClave, setCambiandoClave] = useState(false);

  return (
    <header className="topbar">
      <div>
        <p className="topbar__eyebrow">Trazabilidad de campo</p>
        <h1>AgroControl</h1>
      </div>
      {sesion && (
        <div className="topbar__user">
          <div className="topbar__user-name">
            <strong>{sesion.nombreCompleto}</strong>
            <small>{sesion.email}</small>
          </div>
          <span className="topbar__status">{NOMBRE_ROL[sesion.rol]}</span>
          <Button variant="secondary" type="button" onClick={() => setCambiandoClave(true)}>
            Cambiar contraseña
          </Button>
          <Button variant="secondary"
            type="button"
            onClick={() => {
              cerrarSesion();
              navigate('/login', { replace: true });
            }}
          >
            Salir
          </Button>
        </div>
      )}
      <Modal open={cambiandoClave} title="Cambiar contraseña" onClose={() => setCambiandoClave(false)}>
        <CambiarPasswordForm onListo={() => setCambiandoClave(false)} onCancelar={() => setCambiandoClave(false)} />
      </Modal>
    </header>
  );
}
