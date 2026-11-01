import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { campanaAbierta } from '../../../shared/utils/estados';
import { hoyISO } from '../../../utils/formato';
import type { Campana } from '../models/Campana';
import { campanaService } from '../services/campanaService';
import { etiquetaParcela, type Catalogos } from '../utils/etiquetas';
import Button from '../../../components/ui/Button';

interface CampanaFormProps {
  catalogos: Catalogos;
  campanas: Campana[];
  // Con campana se corrige el plan; sin campana se crea una nueva
  campana?: Campana;
  onGuardado: (campana: Campana) => void;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'parcelaId' | 'cultivoId' | 'fechaInicio', string>>;

export default function CampanaForm({ catalogos, campanas, campana, onGuardado, onCerrar }: CampanaFormProps) {
  const editando = Boolean(campana);
  const [parcelaId, setParcelaId] = useState(campana ? String(campana.parcelaId) : '');
  const [cultivoId, setCultivoId] = useState(campana ? String(campana.cultivoId) : '');
  const [fechaInicio, setFechaInicio] = useState(campana?.fechaInicio ?? hoyISO());
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Una parcela trabaja una campaña a la vez: se ofrecen solo las que no tienen una abierta.
  const parcelasOcupadas = new Set(
    campanas.filter(campanaAbierta).map((campana) => campana.parcelaId),
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
      if (campana) {
        onGuardado(await campanaService.editar(campana.id, { cultivoId: Number(cultivoId), fechaInicio }));
        return;
      }
      const creada = await campanaService.crear({
        parcelaId: Number(parcelaId),
        cultivoId: Number(cultivoId),
        fechaInicio,
      });
      onGuardado(creada);
      setParcelaId('');
      setCultivoId('');
      setMensaje('Campaña planificada correctamente.');
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
          Parcela
          {campana ? (
            <input value={etiquetaParcela(campana.parcelaId, catalogos)} readOnly />
          ) : (
            <select value={parcelaId} onChange={(e) => setParcelaId(e.target.value)}>
              <option value="">Seleccione una parcela</option>
              {parcelasLibres.map((parcela) => (
                <option key={parcela.id} value={parcela.id}>{etiquetaParcela(parcela.id, catalogos)}</option>
              ))}
            </select>
          )}
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
        {onCerrar && (
          <Button variant="secondary" type="button" onClick={onCerrar}>Cancelar</Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Planificar campaña'}
        </Button>
      </div>
    </form>
  );
}
