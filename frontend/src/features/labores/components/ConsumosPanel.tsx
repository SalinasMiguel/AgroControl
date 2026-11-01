import { useState, type FormEvent } from 'react';
import MotivoDialog from '../../../components/ui/MotivoDialog';
import { useCarga } from '../../../hooks/useCarga';
import { formatCantidad, formatFecha, validarCantidadPositiva } from '../../../utils/formato';
import { CATEGORIAS, type Insumo } from '../../insumos/models/Insumo';
import { useSesion } from '../../auth/context/useAuth';
import type { ConsumoLabor, Labor } from '../models/Labor';
import { laborService } from '../services/laborService';
import Button from '../../../components/ui/Button';

interface ConsumosPanelProps {
  labor: Labor;
  insumos: Insumo[];
  // Supervisor y almacenero ven los consumos pero no registran
  puedeRegistrar: boolean;
  puedeAnular: boolean;
  onConsumoRegistrado: () => void;
  onCerrar: () => void;
}

export default function ConsumosPanel({ labor, insumos, puedeRegistrar, puedeAnular, onConsumoRegistrado, onCerrar }: ConsumosPanelProps) {
  const sesion = useSesion();
  const { datos: consumos, setDatos: setConsumos, loading, error } = useCarga<ConsumoLabor[]>(
    (signal) => laborService.listarConsumos(labor.id, signal),
    [],
    labor.id,
  );
  const [insumoId, setInsumoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [anulando, setAnulando] = useState<ConsumoLabor | null>(null);

  const anular = async (motivo: string) => {
    if (!anulando) return;
    const anulado = await laborService.anularConsumo(labor.id, anulando.id, motivo);
    setConsumos((prev) => prev.map((item) => (item.id === anulado.id ? anulado : item)));
    setAnulando(null);
    onConsumoRegistrado();
  };

  const insumo = (id: number) => insumos.find((item) => item.id === id);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errorCantidad = validarCantidadPositiva(cantidad);
    if (!insumoId || errorCantidad) {
      setErrorForm(errorCantidad ?? 'Seleccione el insumo.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorForm('');
      const nuevo = await laborService.registrarConsumo(labor.id, {
        insumoId: Number(insumoId),
        cantidad: Number(cantidad),
      });
      setConsumos((prev) => [...prev, nuevo]);
      setCantidad('');
      onConsumoRegistrado();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="entity-form">
      <h3 className="panel-title">Insumos usados en {labor.tipo.replace(/_/g, ' ').toLowerCase()} (labor #{labor.id})</h3>

      {loading && <p className="muted">Cargando consumos...</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && consumos.length === 0 && <p className="muted">Todavía no se registraron insumos en esta labor.</p>}
      {consumos.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Insumo</th><th>Cantidad</th><th>Fecha</th>{puedeAnular && <th>Acciones</th>}</tr>
            </thead>
            <tbody>
              {consumos.map((consumo) => (
                <tr key={consumo.id} className={consumo.anulado ? 'fila-anulada' : undefined} title={consumo.motivoAnulacion ?? undefined}>
                  <td>{insumo(consumo.insumoId)?.nombre ?? `Insumo ${consumo.insumoId}`}</td>
                  <td>{formatCantidad(consumo.cantidad, insumo(consumo.insumoId)?.unidadMedida ?? '')}</td>
                  <td>{formatFecha(consumo.fecha)}</td>
                  {puedeAnular && (
                    <td>
                      {!consumo.anulado && (
                        <Button variant="secondary" size="sm" type="button" onClick={() => setAnulando(consumo)}>Anular</Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!puedeRegistrar && (
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
        </div>
      )}
      {puedeRegistrar && (
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid panel-form">
          <label>
            Insumo
            <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
              <option value="">Seleccione un insumo</option>
              {/* Agrupado como en el almacén: el diésel del tractor no se mezcla con la semilla */}
              {CATEGORIAS.filter((c) => insumos.some((item) => item.categoria === c.valor)).map((c) => (
                <optgroup key={c.valor} label={c.nombre}>
                  {insumos.filter((item) => item.categoria === c.valor).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} (stock: {formatCantidad(item.stockActual, item.unidadMedida)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input type="number" step="0.01" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </label>
          <label>
            Registrado por
            <input value={sesion.nombreCompleto} readOnly />
          </label>
        </div>
        {errorForm && <div className="form-error">{errorForm}</div>}
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCerrar} disabled={submitting}>Cerrar</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Registrar consumo'}
          </Button>
        </div>
      </form>
      )}

      <MotivoDialog
        open={anulando !== null}
        title="Anular consumo"
        confirmLabel="Anular"
        aviso="La cantidad vuelve al stock con una entrada compensatoria."
        onConfirm={anular}
        onCancel={() => setAnulando(null)}
      />
    </div>
  );
}
