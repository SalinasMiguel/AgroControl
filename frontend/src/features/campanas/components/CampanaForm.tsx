import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { hoyISO } from '../../../utils/formato';
import type { Campana } from '../models/Campana';
import { campanaService } from '../services/campanaService';
import { etiquetaParcela, type Catalogos } from '../utils/etiquetas';
import Button from '../../../components/ui/Button';

interface CampanaFormProps {
  catalogos: Catalogos;
  campanas: Campana[];
  onCreated: (campana: Campana) => void;
}

type Errores = Partial<Record<'parcelaId' | 'cultivoId' | 'fechaInicio', string>>;

export default function CampanaForm({ catalogos, campanas, onCreated }: CampanaFormProps) {
  const [parcelaId, setParcelaId] = useState('');
  const [cultivoId, setCultivoId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Una parcela trabaja una campaña a la vez: se ofrecen solo las que no tienen una abierta.
  const parcelasOcupadas = new Set(
    campanas.filter((campana) => campana.estado !== 'FINALIZADA').map((campana) => campana.parcelaId),
  );
  const parcelasLibres = catalogos.parcelas.filter((parcela) => !parcelasOcupadas.has(parcela.id));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
    if (!parcelaId) errores.parcelaId = 'Debe seleccionar una parcela.';
    if (!cultivoId) errores.cultivoId = 'Debe seleccionar un cultivo.';
    if (!fechaInicio) errores.fechaInicio = 'La fecha de inicio es obligatoria.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      const creada = await campanaService.crear({
        parcelaId: Number(parcelaId),
        cultivoId: Number(cultivoId),
        fechaInicio,
      });
      onCreated(creada);
      setParcelaId('');
      setCultivoId('');
      setMensaje('Campaña planificada correctamente.');
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
          Parcela
          <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
            <option value="">Seleccione una parcela</option>
            {parcelasLibres.map((parcela) => (
              <option key={parcela.id} value={parcela.id}>{etiquetaParcela(parcela.id, catalogos)}</option>
            ))}
          </select>
          {errors.parcelaId && <small className="field-error">{errors.parcelaId}</small>}
        </label>
        <label>
          Cultivo
          <select value={cultivoId} onChange={(e) => setCultivoId(e.target.value)}>
            <option value="">Seleccione un cultivo</option>
            {catalogos.cultivos.map((cultivo) => (
              <option key={cultivo.id} value={cultivo.id}>{cultivo.nombre}</option>
            ))}
          </select>
          {errors.cultivoId && <small className="field-error">{errors.cultivoId}</small>}
        </label>
        <label>
          Fecha de inicio
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          {errors.fechaInicio && <small className="field-error">{errors.fechaInicio}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Planificar campaña'}
        </Button>
      </div>
    </form>
  );
}
