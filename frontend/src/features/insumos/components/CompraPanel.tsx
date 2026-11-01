import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/apiClient';
import Button from '../../../components/ui/Button';
import { formatCantidad, validarCantidadPositiva } from '../../../utils/formato';
import type { Insumo } from '../models/Insumo';
import { insumoService } from '../services/insumoService';
import { buscarInsumos } from '../utils/buscarInsumos';

interface CompraPanelProps {
  insumos: Insumo[];
  onRegistrada: () => void;
  onCerrar: () => void;
}

// Entrada guiada: qué llegó, cuánto, y de quién; muestra el stock que va a quedar antes de guardar.
export default function CompraPanel({ insumos, onRegistrada, onCerrar }: CompraPanelProps) {
  const [busqueda, setBusqueda] = useState('');
  const [insumoId, setInsumoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const insumo = insumos.find((item) => item.id === Number(insumoId));
  const opciones = buscarInsumos(insumos, busqueda);
  const cantidadValida = validarCantidadPositiva(cantidad) === undefined;

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setApiError('');
    const errores: Record<string, string> = {};
    if (!insumo) errores.insumoId = 'Elija el insumo que llegó.';
    const errorCantidad = validarCantidadPositiva(cantidad);
    if (errorCantidad) errores.cantidad = errorCantidad;
    setErrors(errores);
    if (Object.keys(errores).length > 0 || !insumo) return;
    try {
      setSubmitting(true);
      await insumoService.registrarCompra(insumo.id, {
        cantidad: Number(cantidad),
        motivo: 'Compra',
        proveedor: proveedor.trim() || null,
        numeroFactura: numeroFactura.trim() || null,
      });
      onRegistrada();
      setCantidad('');
      setInsumoId('');
      setBusqueda('');
      setMensaje(`Entrada registrada: ${formatCantidad(Number(cantidad), insumo.unidadMedida)} de ${insumo.nombre}.`);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.campos);
      setApiError(err instanceof Error ? err.message : 'No se pudo registrar la compra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={guardar} noValidate>
      <h3 className="panel-title">Registrar compra</h3>
      <div className="form-grid">
        <label>
          Buscar insumo
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Código, marca o nombre" />
        </label>
        <label>
          Insumo
          <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
            <option value="">Seleccione ({opciones.length})</option>
            {opciones.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}{item.marca ? ` · ${item.marca}` : ''}</option>
            ))}
          </select>
          {errors.insumoId && <small className="field-error">{errors.insumoId}</small>}
        </label>
        <label>
          Cantidad{insumo ? ` (${insumo.unidadMedida})` : ''}
          <input type="number" step="0.01" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          {errors.cantidad && <small className="field-error">{errors.cantidad}</small>}
          {insumo && cantidadValida && (
            <small className="muted">
              Stock: {formatCantidad(insumo.stockActual, insumo.unidadMedida)} → {formatCantidad(insumo.stockActual + Number(cantidad), insumo.unidadMedida)}
            </small>
          )}
        </label>
        <label>
          Proveedor (opcional)
          <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} maxLength={120} />
          {errors.proveedor && <small className="field-error">{errors.proveedor}</small>}
        </label>
        <label>
          N.º de factura (opcional)
          <input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} maxLength={40} />
          {errors.numeroFactura && <small className="field-error">{errors.numeroFactura}</small>}
        </label>
      </div>
      {mensaje && <div className="form-success">{mensaje}</div>}
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Registrar compra'}</Button>
      </div>
    </form>
  );
}
