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
  // Con usuario se edita; sin usuario se crea uno nuevo
  usuario?: Usuario;
  onGuardado: (usuario: Usuario) => void;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'rolId' | 'nombreCompleto' | 'email' | 'password', string>>;

export default function UsuarioForm({ roles, usuario, onGuardado, onCerrar }: UsuarioFormProps) {
  const editando = Boolean(usuario);
  const [nombreCompleto, setNombreCompleto] = useState(usuario?.nombreCompleto ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState(usuario ? String(usuario.rolId) : '');
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
    if (!editando && password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (!rolId) errores.rolId = 'Seleccione el rol.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      const datos = { rolId: Number(rolId), nombreCompleto: nombreCompleto.trim(), email: email.trim() };
      if (usuario) {
        onGuardado(await usuarioService.actualizar(usuario.id, datos));
        return;
      }
      onGuardado(await usuarioService.crear({ ...datos, password }));
      setNombreCompleto('');
      setEmail('');
      setPassword('');
      setMensaje('Usuario creado: ya puede iniciar sesión con su email y contraseña.');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo guardar');
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
        {!editando && (
          <label>
            Contraseña
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>
        )}
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
        {onCerrar && (
          <Button variant="secondary" type="button" onClick={onCerrar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
