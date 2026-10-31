import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import type { Cultivo } from '../models/Cultivo';
import { cultivoService } from '../services/cultivoService';

interface CultivoFormProps {
  // Con cultivo se edita; sin cultivo se crea uno nuevo
  cultivo?: Cultivo;
  onGuardado: (cultivo: Cultivo) => void;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'nombre' | 'cicloDias', string>>;

export default function CultivoForm({ cultivo, onGuardado, onCerrar }: CultivoFormProps) {
  const [nombre, setNombre] = useState(cultivo?.nombre ?? '');
  const [cicloDias, setCicloDias] = useState(cultivo?.cicloDias ? String(cultivo.cicloDias) : '');
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validar = (): Errores => {
    const errores: Errores = {};
    if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
    else if (nombre.trim().length > 80) errores.nombre = 'El nombre admite como maximo 80 caracteres.';
    if (cicloDias && (!Number.isInteger(Number(cicloDias)) || Number(cicloDias) <= 0)) {
      errores.cicloDias = 'El ciclo debe ser un numero entero de dias mayor que cero.';
    }
    return errores;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores = validar();
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      const datos = { nombre: nombre.trim(), cicloDias: cicloDias ? Number(cicloDias) : null };
      if (cultivo) {
        onGuardado(await cultivoService.actualizar(cultivo.id, datos));
        return;
      }
      onGuardado(await cultivoService.crear(datos));
      setNombre('');
      setCicloDias('');
      setMensaje('Cultivo creado correctamente.');
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
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Girasol" />
          {errors.nombre && <small className="field-error">{errors.nombre}</small>}
        </label>
        <label>
          Ciclo (dias)
          <input type="number" min="1" value={cicloDias} onChange={(e) => setCicloDias(e.target.value)} />
          {errors.cicloDias && <small className="field-error">{errors.cicloDias}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        {onCerrar && (
          <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar cultivo'}
        </button>
      </div>
    </form>
  );
}
