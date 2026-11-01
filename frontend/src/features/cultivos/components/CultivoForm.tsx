import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import type { Cultivo } from '../models/Cultivo';
import { cultivoService } from '../services/cultivoService';
import Button from '../../../components/ui/Button';

interface CultivoFormProps {
  // Con cultivo se edita; sin cultivo se crea uno nuevo
  cultivo?: Cultivo;
  onGuardado: (cultivo: Cultivo) => void;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'nombre' | 'cicloDias' | 'humedadEstandarPct', string>>;

export default function CultivoForm({ cultivo, onGuardado, onCerrar }: CultivoFormProps) {
  const [nombre, setNombre] = useState(cultivo?.nombre ?? '');
  const [cicloDias, setCicloDias] = useState(cultivo?.cicloDias ? String(cultivo.cicloDias) : '');
  const [humedad, setHumedad] = useState(cultivo?.humedadEstandarPct != null ? String(cultivo.humedadEstandarPct) : '');
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
    if (humedad && (Number(humedad) < 0 || Number(humedad) >= 100)) {
      errores.humedadEstandarPct = 'Use un valor entre 0 y 99,99.';
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
      const datos = { nombre: nombre.trim(), cicloDias: cicloDias ? Number(cicloDias) : null, humedadEstandarPct: humedad ? Number(humedad) : null };
      if (cultivo) {
        onGuardado(await cultivoService.actualizar(cultivo.id, datos));
        return;
      }
      onGuardado(await cultivoService.crear(datos));
      setNombre('');
      setCicloDias('');
      setHumedad('');
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
        <label>
          Humedad estándar % (opcional)
          <input type="number" step="0.01" min="0" max="99.99" value={humedad} onChange={(e) => setHumedad(e.target.value)} placeholder="Ej.: 13" />
          <small className="muted">A esta humedad se paga el grano; ajusta el rendimiento.</small>
          {errors.humedadEstandarPct && <small className="field-error">{errors.humedadEstandarPct}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        {onCerrar && (
          <Button variant="secondary" type="button" onClick={onCerrar}>Cancelar</Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar cultivo'}
        </Button>
      </div>
    </form>
  );
}
