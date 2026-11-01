import { useState, type FormEvent } from 'react';
import type { Usuario } from '../../usuarios/models/Usuario';
import type { AsignacionLabor, Labor } from '../models/Labor';
import { laborService } from '../services/laborService';
import Button from '../../../components/ui/Button';

interface AsignarPanelProps {
  labor: Labor;
  // Operarios activos que todavía no están en la labor
  disponibles: Usuario[];
  onAsignado: (asignacion: AsignacionLabor) => void;
  onCerrar: () => void;
}

// RF-05: el jefe de campo asigna operarios; el operario solo verá las labores asignadas (RN-05).
export default function AsignarPanel({ labor, disponibles, onAsignado, onCerrar }: AsignarPanelProps) {
  const [usuarioId, setUsuarioId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usuarioId) {
      setError('Seleccione un operario.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      onAsignado(await laborService.asignar(labor.id, Number(usuarioId)));
      setUsuarioId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      <h3 className="panel-title">Asignar operario a {labor.tipo.replace(/_/g, ' ').toLowerCase()} (labor #{labor.id})</h3>
      <div className="form-grid panel-form">
        <label>
          Operario
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">{disponibles.length === 0 ? 'No quedan operarios por asignar' : 'Seleccione un operario'}</option>
            {disponibles.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>{usuario.nombreCompleto}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar} disabled={submitting}>Cerrar</Button>
        <Button type="submit" disabled={submitting || disponibles.length === 0}>
          {submitting ? 'Asignando...' : 'Asignar'}
        </Button>
      </div>
    </form>
  );
}
