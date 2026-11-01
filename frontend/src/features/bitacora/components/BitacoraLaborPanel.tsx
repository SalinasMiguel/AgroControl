import { useState, type FormEvent } from 'react';
import { useCarga } from '../../../hooks/useCarga';
import { formatFecha } from '../../../utils/formato';
import { useSesion } from '../../auth/context/useAuth';
import type { Labor } from '../../labores/models/Labor';
import type { Usuario } from '../../usuarios/models/Usuario';
import { nombreUsuario, usuarioService } from '../../usuarios/services/usuarioService';
import type { EntradaBitacora } from '../models/Bitacora';
import { bitacoraService } from '../services/bitacoraService';
import Button from '../../../components/ui/Button';

interface BitacoraLaborPanelProps {
  labor: Labor;
  // El almacenero la consulta; quienes están en el campo además escriben
  puedeRegistrar: boolean;
  onCerrar: () => void;
}

const cargar = (laborId: number) => async (signal: AbortSignal) => {
  const [entradas, usuarios] = await Promise.all([
    bitacoraService.listarDeLabor(laborId, signal),
    usuarioService.listar(signal),
  ]);
  return { entradas, usuarios };
};

// RF-09: observaciones de campo de una labor, de la más reciente a la más antigua
export default function BitacoraLaborPanel({ labor, puedeRegistrar, onCerrar }: BitacoraLaborPanelProps) {
  const sesion = useSesion();
  const { datos, setDatos, loading, error } = useCarga(
    cargar(labor.id),
    { entradas: [] as EntradaBitacora[], usuarios: [] as Usuario[] },
    labor.id,
  );
  const [observacion, setObservacion] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const texto = observacion.trim();
    if (!texto) {
      setErrorForm('Escriba la observación: qué se hizo, cantidades y estado del cultivo.');
      return;
    }
    if (texto.length > 2000) {
      setErrorForm('Use como máximo 2000 caracteres.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorForm('');
      const nueva = await bitacoraService.registrar(labor.id, texto);
      setDatos((prev) => ({ ...prev, entradas: [nueva, ...prev.entradas] }));
      setObservacion('');
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="entity-form">
      <h3 className="panel-title">Bitácora de {labor.tipo.replace(/_/g, ' ').toLowerCase()} (labor #{labor.id})</h3>

      {loading && <p className="muted">Cargando bitácora...</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && datos.entradas.length === 0 && <p className="muted">Todavía no hay observaciones en esta labor.</p>}
      {datos.entradas.length > 0 && (
        <ul className="bitacora-lista">
          {datos.entradas.map((entrada) => (
            <li key={entrada.id}>
              <p>{entrada.observacion}</p>
              <small className="muted">
                {formatFecha(entrada.fecha)} · {nombreUsuario(datos.usuarios, entrada.usuarioId)}
              </small>
            </li>
          ))}
        </ul>
      )}

      {puedeRegistrar ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid panel-form">
            <label className="form-span-2">
              Nueva observación
              <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} maxLength={2000} />
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
              {submitting ? 'Guardando...' : 'Agregar a la bitácora'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
        </div>
      )}
    </div>
  );
}
