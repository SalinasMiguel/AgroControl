import { useState, type FormEvent } from 'react';
import type { Incidencia } from '../models/Incidencia';
import { incidenciaService } from '../services/incidenciaService';
import Button from '../../../components/ui/Button';

interface ResolverPanelProps {
  incidencia: Incidencia;
  onResuelta: (incidencia: Incidencia) => void;
  onCerrar: () => void;
}

// Cerrar una incidencia pide decir qué se hizo: queda en el historial de la parcela
export default function ResolverPanel({ incidencia, onResuelta, onCerrar }: ResolverPanelProps) {
  const [resolucion, setResolucion] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resolucion.trim()) {
      setError('Cuente cómo se resolvió (p. ej. "Se fumigó con insecticida el 25/10").');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      onResuelta(await incidenciaService.resolver(incidencia.id, resolucion.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resolver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      <h3 className="panel-title">Resolver incidencia #{incidencia.id}</h3>
      <p className="muted">{incidencia.descripcion}</p>
      <div className="form-grid">
        <label className="form-span-2">
          ¿Cómo se resolvió?
          <textarea value={resolucion} onChange={(e) => setResolucion(e.target.value)} maxLength={1000} />
        </label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Marcar como resuelta'}
        </Button>
      </div>
    </form>
  );
}
