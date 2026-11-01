import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { NOMBRE_ROL } from '../../auth/permisos';
import type { Rol } from '../../auth/models/Sesion';
import type { RolCatalogo } from '../models/Rol';
import type { Usuario } from '../models/Usuario';
import { usuarioService } from '../services/usuarioService';
import Button from '../../../components/ui/Button';

interface UsuarioFormProps {
  roles: RolCatalogo[];
  onCreated: (usuario: Usuario) => void;
}

type Errores = Partial<Record<'rolId' | 'nombreCompleto' | 'email' | 'password', string>>;

export default function UsuarioForm({ roles, onCreated }: UsuarioFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState('');
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
    if (!nombreCompleto.trim()) errores.nombreCompleto = 'El nombre es obligatorio.';
    if (!email.includes('@')) errores.email = 'Ingrese un email válido.';
    if (password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (!rolId) errores.rolId = 'Seleccione el rol.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      const creado = await usuarioService.crear({
        rolId: Number(rolId),
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim(),
        password,
      });
      onCreated(creado);
      setNombreCompleto('');
      setEmail('');
      setPassword('');
      setMensaje('Usuario creado: ya puede iniciar sesión con su email y contraseña.');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label>
          Nombre completo
          <input value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
          {errors.nombreCompleto && <small className="field-error">{errors.nombreCompleto}</small>}
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <small className="field-error">{errors.password}</small>}
        </label>
        <label>
          Rol
          <select value={rolId} onChange={(e) => setRolId(e.target.value)}>
            <option value="">Seleccione un rol</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>{NOMBRE_ROL[rol.nombre as Rol] ?? rol.nombre}</option>
            ))}
          </select>
          {errors.rolId && <small className="field-error">{errors.rolId}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
