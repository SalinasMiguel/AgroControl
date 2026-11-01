import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { hoyISO } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { etiquetaCampana, type Catalogos } from '../../campanas/utils/etiquetas';
import { TIPOS_LABOR, type Labor } from '../models/Labor';
import { laborService } from '../services/laborService';
import Button from '../../../components/ui/Button';

interface LaborFormProps {
  campanas: Campana[];
  catalogos: Catalogos;
  onCreated: (labor: Labor) => void;
}

type Errores = Partial<Record<'campanaId' | 'tipo' | 'fechaPlan', string>>;

export default function LaborForm({ campanas, catalogos, onCreated }: LaborFormProps) {
  const [campanaId, setCampanaId] = useState('');
  const [tipo, setTipo] = useState('');
  const [fechaPlan, setFechaPlan] = useState(hoyISO());
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const campanasAbiertas = campanas.filter((campana) => campana.estado !== 'FINALIZADA');

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
      // La parcela no se envía: el backend la toma de la campaña.
      const creada = await laborService.planificar({ campanaId: Number(campanaId), tipo, fechaPlan });
      onCreated(creada);
      setTipo('');
      setMensaje('Labor planificada correctamente.');
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
        <label className="form-span-2">
          Campaña
          <select value={campanaId} onChange={(e) => setCampanaId(e.target.value)}>
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
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Planificar labor'}
        </Button>
      </div>
    </form>
  );
}
