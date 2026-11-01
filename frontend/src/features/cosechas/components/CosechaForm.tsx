import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import { validarCantidadPositiva } from '../../../utils/formato';
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

type Errores = Partial<Record<'campanaId' | 'cantidad', string>>;

export default function CosechaForm({ campanas, catalogos, onCreated }: CosechaFormProps) {
  const sesion = useSesion();
  const [campanaId, setCampanaId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('t');
  const [errors, setErrors] = useState<Errores>({});
  const [mensaje, setMensaje] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Solo se cosecha una campaña que ya empezó.
  const cosechables = campanas.filter((campana) => campana.estado !== 'PLANIFICADA');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Errores = {};
    if (!campanaId) errores.campanaId = 'Debe seleccionar una campaña.';
    const errorCantidad = validarCantidadPositiva(cantidad);
    if (errorCantidad) errores.cantidad = errorCantidad;
    setErrors(errores);
    if (Object.keys(errores).length > 0) return;

    try {
      setSubmitting(true);
      const creada = await cosechaService.registrar({
        campanaId: Number(campanaId),
        cantidad: Number(cantidad),
        unidadMedida,
      });
      onCreated(creada);
      setCantidad('');
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
            <option value="">Seleccione una campaña en curso o finalizada</option>
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
