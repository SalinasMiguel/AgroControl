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
}

type Errores = Partial<Record<'campanaId' | 'cantidad' | 'fecha' | 'humedadPct' | 'impurezasPct' | 'numeroBoleta', string>>;

const porcentajeInvalido = (valor: string) => {
  if (!valor.trim()) return false;
  const numero = Number(valor);
  return !Number.isFinite(numero) || numero < 0 || numero > 100;
};

export default function CosechaForm({ campanas, catalogos, onCreated }: CosechaFormProps) {
  const sesion = useSesion();
  const [campanaId, setCampanaId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('t');
  const [fecha, setFecha] = useState(hoyISO());
  const [humedad, setHumedad] = useState('');
  const [impurezas, setImpurezas] = useState('');
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // RN-06: solo se cosecha una campaña en curso; una cosecha tardía exige reabrirla.
  const cosechables = campanas.filter((campana) => campana.estado === 'EN_CURSO');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
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
      const creada = await cosechaService.registrar({
        campanaId: Number(campanaId),
        cantidad: Number(cantidad),
        unidadMedida,
        fecha,
        humedadPct: humedad.trim() ? Number(humedad) : null,
        impurezasPct: impurezas.trim() ? Number(impurezas) : null,
        numeroBoleta: numeroBoleta.trim() || null,
      });
      onCreated(creada);
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
      <div className="form-grid">
        <label className="form-span-2">
          Campaña
          <select value={campanaId} onChange={(e) => setCampanaId(e.target.value)}>
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
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Registrar cosecha'}
        </Button>
      </div>
    </form>
  );
}
