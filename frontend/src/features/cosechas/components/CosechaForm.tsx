import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { hoyISO, validarCantidadPositiva } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { etiquetaCampana, type Catalogos } from '../../campanas/utils/etiquetas';
import { useSesion } from '../../auth/context/useAuth';
import type { Cosecha } from '../models/Cosecha';
import { cosechaService } from '../services/cosechaService';
import Button from '../../../components/ui/Button';

const UNIDADES = ['t', 'kg', 'qq'];

interface CosechaFormProps {
  campanas: Campana[];
  catalogos: Catalogos;
  onCreated: (cosecha: Cosecha) => void;
  // Con esta cosecha, el formulario la corrige: la anula y registra los datos nuevos
  corrigiendo?: Cosecha;
  onCerrar?: () => void;
}

type Errores = Partial<Record<'motivo' | 'campanaId' | 'cantidad' | 'fecha' | 'humedadPct' | 'impurezasPct' | 'numeroBoleta', string>>;

const porcentajeInvalido = (valor: string) => {
  if (!valor.trim()) return false;
  const numero = Number(valor);
  return !Number.isFinite(numero) || numero < 0 || numero > 100;
};

export default function CosechaForm({ campanas, catalogos, onCreated, corrigiendo, onCerrar }: CosechaFormProps) {
  const sesion = useSesion();
  const [campanaId, setCampanaId] = useState(corrigiendo ? String(corrigiendo.campanaId) : '');
  const [cantidad, setCantidad] = useState(corrigiendo ? String(corrigiendo.cantidad) : '');
  const [unidadMedida, setUnidadMedida] = useState(corrigiendo?.unidadMedida ?? 't');
  const [fecha, setFecha] = useState(corrigiendo?.fecha ?? hoyISO());
  const [humedad, setHumedad] = useState(corrigiendo?.humedadPct != null ? String(corrigiendo.humedadPct) : '');
  const [impurezas, setImpurezas] = useState(corrigiendo?.impurezasPct != null ? String(corrigiendo.impurezasPct) : '');
  const [numeroBoleta, setNumeroBoleta] = useState(corrigiendo?.numeroBoleta ?? '');
  const [motivo, setMotivo] = useState('');
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // RN-06: solo se cosecha una campaña en curso; una cosecha tardía exige reabrirla.
  const cosechables = campanas.filter((campana) => (corrigiendo ? campana.id === corrigiendo.campanaId : campana.estado === 'EN_CURSO'));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
    if (corrigiendo && !motivo.trim()) errores.motivo = 'Indique por qué se corrige.';
    else if (motivo.trim().length > 200) errores.motivo = 'Use como máximo 200 caracteres.';
    if (!campanaId) errores.campanaId = 'Debe seleccionar una campaña.';
    const errorCantidad = validarCantidadPositiva(cantidad);
    if (errorCantidad) errores.cantidad = errorCantidad;
    if (!fecha) errores.fecha = 'La fecha es obligatoria.';
    else if (fecha > hoyISO()) errores.fecha = 'La fecha no puede ser futura.';
    if (porcentajeInvalido(humedad)) errores.humedadPct = 'Use un valor entre 0 y 100.';
    if (porcentajeInvalido(impurezas)) errores.impurezasPct = 'Use un valor entre 0 y 100.';
    if (numeroBoleta.trim().length > 30) errores.numeroBoleta = 'Use como máximo 30 caracteres.';
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      const datos = {
        cantidad: Number(cantidad),
        unidadMedida,
        fecha,
        humedadPct: humedad.trim() ? Number(humedad) : null,
        impurezasPct: impurezas.trim() ? Number(impurezas) : null,
        numeroBoleta: numeroBoleta.trim() || null,
      };
      if (corrigiendo) {
        onCreated(await cosechaService.corregir(corrigiendo.id, { ...datos, motivo: motivo.trim() }));
        return;
      }
      onCreated(await cosechaService.registrar({ ...datos, campanaId: Number(campanaId) }));
      setCantidad('');
      setHumedad('');
      setImpurezas('');
      setNumeroBoleta('');
      setMensaje('Cosecha registrada correctamente.');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      {corrigiendo && <h3 className="panel-title">Corregir cosecha</h3>}
      <div className="form-grid">
        {corrigiendo && (
          <label className="form-span-2">
            Motivo de la corrección
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: la boleta decía 12 t" maxLength={200} />
            <small className="muted">La carga original queda anulada en el historial.</small>
            {errors.motivo && <small className="field-error">{errors.motivo}</small>}
          </label>
        )}
        <label className="form-span-2">
          Campaña
          <select disabled={Boolean(corrigiendo)} value={campanaId} onChange={(e) => setCampanaId(e.target.value)}>
            <option value="">Seleccione una campaña en curso</option>
            {cosechables.map((campana) => (
              <option key={campana.id} value={campana.id}>{etiquetaCampana(campana, catalogos)}</option>
            ))}
          </select>
          {errors.campanaId && <small className="field-error">{errors.campanaId}</small>}
        </label>
        <label>
          Cantidad
          <input type="number" step="0.01" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          {errors.cantidad && <small className="field-error">{errors.cantidad}</small>}
        </label>
        <label>
          Unidad
          <select value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)}>
            {UNIDADES.map((unidad) => <option key={unidad} value={unidad}>{unidad}</option>)}
          </select>
        </label>
        <label>
          Fecha
          <input type="date" max={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          {errors.fecha && <small className="field-error">{errors.fecha}</small>}
        </label>
        <label>
          N.º de boleta (opcional)
          <input value={numeroBoleta} onChange={(e) => setNumeroBoleta(e.target.value)} placeholder="Ej.: B-00123" maxLength={30} />
          {errors.numeroBoleta && <small className="field-error">{errors.numeroBoleta}</small>}
        </label>
        <label>
          Humedad % (opcional)
          <input type="number" step="0.01" min="0" max="100" value={humedad} onChange={(e) => setHumedad(e.target.value)} placeholder="Ej.: 14" />
          {errors.humedadPct && <small className="field-error">{errors.humedadPct}</small>}
        </label>
        <label>
          Impurezas % (opcional)
          <input type="number" step="0.01" min="0" max="100" value={impurezas} onChange={(e) => setImpurezas(e.target.value)} placeholder="Ej.: 1,5" />
          {errors.impurezasPct && <small className="field-error">{errors.impurezasPct}</small>}
        </label>
        <label>
          Registrado por
          <input value={sesion.nombreCompleto} readOnly />
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        {onCerrar && <Button variant="secondary" type="button" onClick={onCerrar}>Cancelar</Button>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : corrigiendo ? 'Guardar corrección' : 'Registrar cosecha'}
        </Button>
      </div>
    </form>
  );
}
