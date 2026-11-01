import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { useAuth } from '../context/useAuth';
import { authService } from '../services/authService';
import Button from '../../../components/ui/Button';

interface CambiarPasswordFormProps {
  onListo: () => void;
  onCancelar?: () => void;
}

type Errores = Partial<Record<'passwordActual' | 'passwordNueva' | 'repetida', string>>;

export default function CambiarPasswordForm({ onListo, onCancelar }: CambiarPasswordFormProps) {
  const { actualizarSesion } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [errors, setErrors] = useState<Errores>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');
    const errores: Errores = {};
    if (!passwordActual) errores.passwordActual = 'Ingrese su contraseña actual.';
    if (passwordNueva.length < 8 || passwordNueva.length > 72) {
      errores.passwordNueva = 'La contraseña debe tener entre 8 y 72 caracteres.';
    }
    if (repetida !== passwordNueva) errores.repetida = 'Las contraseñas no coinciden.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      actualizarSesion(await authService.cambiarPassword(passwordActual, passwordNueva));
      onListo();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      <label>
        Contraseña actual
        <input
          type="password"
          autoComplete="current-password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
        />
        {errors.passwordActual && <small className="field-error">{errors.passwordActual}</small>}
      </label>
      <label>
        Contraseña nueva
        <input
          type="password"
          autoComplete="new-password"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
        />
        {errors.passwordNueva && <small className="field-error">{errors.passwordNueva}</small>}
      </label>
      <label>
        Repita la contraseña nueva
        <input
          type="password"
          autoComplete="new-password"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
        />
        {errors.repetida && <small className="field-error">{errors.repetida}</small>}
      </label>
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        {onCancelar && (
          <Button variant="secondary" type="button" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Cambiar contraseña'}
        </Button>
      </div>
    </form>
  );
}
