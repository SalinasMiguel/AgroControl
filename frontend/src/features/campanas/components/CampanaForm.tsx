import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { campanaAbierta } from '../../../shared/utils/estados';
import { parseArea, validarArea } from '../../../utils/area';
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

type Errores = Partial<Record<'parcelaId' | 'cultivoId' | 'fechaInicio' | 'areaSembradaHa' | 'variedad' | 'fechaCosechaEstimada', string>>;

export default function CampanaForm({ catalogos, campanas, campana, onGuardado, onCerrar }: CampanaFormProps) {
  const editando = Boolean(campana);
  const [parcelaId, setParcelaId] = useState(campana ? String(campana.parcelaId) : '');
  const [cultivoId, setCultivoId] = useState(campana ? String(campana.cultivoId) : '');
  const [fechaInicio, setFechaInicio] = useState(campana?.fechaInicio ?? hoyISO());
  const [areaSembrada, setAreaSembrada] = useState(campana?.areaSembradaHa != null ? String(campana.areaSembradaHa) : '');
  const [variedad, setVariedad] = useState(campana?.variedad ?? '');
  const [cosechaEstimada, setCosechaEstimada] = useState(campana?.fechaCosechaEstimada ?? '');
  // En curso la siembra ya ocurrió: se corrige lo sembrado, no el cultivo ni el inicio.
  const enCurso = campana?.estado === 'EN_CURSO';
  const parcelaElegida = catalogos.parcelas.find((parcela) => parcela.id === (campana?.parcelaId ?? Number(parcelaId)));
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
    const errorArea = areaSembrada.trim() ? validarArea(areaSembrada) : undefined;
    if (errorArea) errores.areaSembradaHa = errorArea;
    if (variedad.trim().length > 80) errores.variedad = 'La variedad admite como máximo 80 caracteres.';
    if (cosechaEstimada && cosechaEstimada < fechaInicio) errores.fechaCosechaEstimada = 'No puede ser anterior a la fecha de inicio.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    const siembra = {
      areaSembradaHa: areaSembrada.trim() ? parseArea(areaSembrada) : null,
      variedad: variedad.trim() || null,
      fechaCosechaEstimada: cosechaEstimada || null,
    };

    try {
      setSubmitting(true);
      if (campana) {
        onGuardado(await campanaService.editar(campana.id, { cultivoId: Number(cultivoId), fechaInicio, ...siembra }));
        return;
      }
      const creada = await campanaService.crear({
        parcelaId: Number(parcelaId),
        cultivoId: Number(cultivoId),
        fechaInicio,
        ...siembra,
      });
      onGuardado(creada);
      setParcelaId('');
      setCultivoId('');
      setAreaSembrada('');
      setVariedad('');
      setCosechaEstimada('');
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
          <select value={cultivoId} onChange={(e) => setCultivoId(e.target.value)} disabled={enCurso}>
            <option value="">Seleccione un cultivo</option>
            {catalogos.cultivos.map((cultivo) => (
              <option key={cultivo.id} value={cultivo.id}>{cultivo.nombre}</option>
            ))}
          </select>
          {errors.cultivoId && <small className="field-error">{errors.cultivoId}</small>}
        </label>
        <label>
          Fecha de inicio
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} disabled={enCurso} />
          {errors.fechaInicio && <small className="field-error">{errors.fechaInicio}</small>}
        </label>
        <label>
          Variedad o híbrido (opcional)
          <input value={variedad} onChange={(e) => setVariedad(e.target.value)} placeholder="Ej.: DK 7500, Munasqa RR" />
          {errors.variedad && <small className="field-error">{errors.variedad}</small>}
        </label>
        <label>
          Hectáreas sembradas (opcional)
          <input
            type="number"
            min="0"
            step="0.01"
            value={areaSembrada}
            onChange={(e) => setAreaSembrada(e.target.value)}
            placeholder={parcelaElegida?.areaHa ? `Vacío = toda la parcela (${parcelaElegida.areaHa} ha)` : 'Vacío = toda la parcela'}
          />
          {errors.areaSembradaHa && <small className="field-error">{errors.areaSembradaHa}</small>}
        </label>
        <label>
          Cosecha estimada (opcional)
          <input type="date" value={cosechaEstimada} min={fechaInicio} onChange={(e) => setCosechaEstimada(e.target.value)} />
          {errors.fechaCosechaEstimada && <small className="field-error">{errors.fechaCosechaEstimada}</small>}
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
