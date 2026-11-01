import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { campanaAbierta } from '../../../shared/utils/estados';
import { hoyISO } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { etiquetaCampana, type Catalogos } from '../../campanas/utils/etiquetas';
import { TIPOS_LABOR, type Labor } from '../models/Labor';
import { laborService } from '../services/laborService';
import Button from '../../../components/ui/Button';

interface LaborFormProps {
  campanas: Campana[];
  catalogos: Catalogos;
  // Con labor se corrige el plan; sin labor se crea una nueva
  labor?: Labor;
  onGuardado: (labor: Labor) => void;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'campanaId' | 'tipo' | 'fechaPlan', string>>;

export default function LaborForm({ campanas, catalogos, labor, onGuardado, onCerrar }: LaborFormProps) {
  const editando = Boolean(labor);
  const [campanaId, setCampanaId] = useState(labor ? String(labor.campanaId) : '');
  const [tipo, setTipo] = useState(labor?.tipo ?? '');
  const [fechaPlan, setFechaPlan] = useState(labor?.fechaPlan ?? hoyISO());
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const campanasAbiertas = campanas.filter(campanaAbierta);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
    if (!campanaId) errores.campanaId = 'Debe seleccionar una campaña.';
    if (!tipo) errores.tipo = 'Debe seleccionar el tipo de labor.';
    if (!fechaPlan) errores.fechaPlan = 'La fecha planificada es obligatoria.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      if (labor) {
        onGuardado(await laborService.editar(labor.id, { tipo, fechaPlan }));
        return;
      }
      // La parcela no se envía: el backend la toma de la campaña.
      const creada = await laborService.planificar({ campanaId: Number(campanaId), tipo, fechaPlan });
      onGuardado(creada);
      setTipo('');
      setMensaje('Labor planificada correctamente.');
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
        <label className="form-span-2">
          Campaña
          <select value={campanaId} disabled={editando} onChange={(e) => setCampanaId(e.target.value)}>
            <option value="">Seleccione una campaña abierta</option>
            {campanasAbiertas.map((campana) => (
              <option key={campana.id} value={campana.id}>{etiquetaCampana(campana, catalogos)}</option>
            ))}
          </select>
          {errors.campanaId && <small className="field-error">{errors.campanaId}</small>}
        </label>
        <label>
          Tipo de labor
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Seleccione un tipo</option>
            {TIPOS_LABOR.map((item) => (
              <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {errors.tipo && <small className="field-error">{errors.tipo}</small>}
        </label>
        <label>
          Fecha planificada
          <input type="date" value={fechaPlan} onChange={(e) => setFechaPlan(e.target.value)} />
          {errors.fechaPlan && <small className="field-error">{errors.fechaPlan}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        {onCerrar && (
          <Button variant="secondary" type="button" onClick={onCerrar}>Cancelar</Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Planificar labor'}
        </Button>
      </div>
    </form>
  );
}
