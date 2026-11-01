import { useState, type FormEvent } from 'react';
import { hoyISO } from '../../utils/formato';
import Button from '../ui/Button';

interface FechaAccionPanelProps {
  titulo: string;
  etiqueta: string;
  textoBoton: string;
  onConfirmar: (fecha: string) => Promise<void>;
  onCancelar: () => void;
}

// Panel para acciones que solo piden una fecha: finalizar campaña, ejecutar labor.
export default function FechaAccionPanel({ titulo, etiqueta, textoBoton, onConfirmar, onCancelar }: FechaAccionPanelProps) {
  const [fecha, setFecha] = useState(hoyISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fecha) {
      setError('La fecha es obligatoria.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onConfirmar(fecha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      <h3 className="panel-title">{titulo}</h3>
      <div className="form-grid">
        <label>
          {etiqueta}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCancelar} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : textoBoton}
        </Button>
      </div>
    </form>
  );
}
