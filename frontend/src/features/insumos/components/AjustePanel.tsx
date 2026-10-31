import { useState, type FormEvent } from 'react';
import { formatCantidad } from '../../../utils/formato';
import type { Insumo, MovimientoInsumo } from '../models/Insumo';
import { insumoService } from '../services/insumoService';

interface AjustePanelProps {
  insumo: Insumo;
  onAjustado: (movimiento: MovimientoInsumo) => void;
}

// Conteo físico: el sistema registra la diferencia como un movimiento, no pisa el stock.
export default function AjustePanel({ insumo, onAjustado }: AjustePanelProps) {
  const [stockContado, setStockContado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const contado = Number(stockContado);
    if (stockContado === '' || !Number.isFinite(contado) || contado < 0) {
      setError('Ingrese el stock contado.');
      return;
    }
    if (!motivo.trim()) {
      setError('Indique el motivo.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      onAjustado(await insumoService.ajustar(insumo.id, contado, motivo.trim()));
      setStockContado('');
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h4 className="panel-title">Ajustar por conteo físico (el sistema dice {formatCantidad(insumo.stockActual, insumo.unidadMedida)})</h4>
      <div className="form-grid">
        <label>
          Stock contado ({insumo.unidadMedida})
          <input type="number" step="0.01" min="0" value={stockContado} onChange={(e) => setStockContado(e.target.value)} />
        </label>
        <label>
          Motivo del ajuste
          <input maxLength={150} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: Conteo de fin de mes" />
        </label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" className="btn-secondary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Ajustar stock'}
        </button>
      </div>
    </form>
  );
}
