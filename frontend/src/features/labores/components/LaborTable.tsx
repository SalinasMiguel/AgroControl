import StatusBadge from '../../../components/ui/StatusBadge';
import { laborPendiente } from '../../../shared/utils/estados';
import { formatFecha } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { etiquetaCampana, type Catalogos } from '../../campanas/utils/etiquetas';
import type { Labor } from '../models/Labor';

interface LaborTableProps {
  labores: Labor[];
  campanas: Campana[];
  catalogos: Catalogos;
  // Cada acción es opcional: la página solo pasa las que el rol puede usar
  onIniciar?: (labor: Labor) => void;
  onEjecutar?: (labor: Labor) => void;
  onInsumos: (labor: Labor) => void;
  onBitacora: (labor: Labor) => void;
  onAsignar?: (labor: Labor) => void;
  // Nombres de los operarios por labor; si no viene, no se muestra la columna
  asignados?: Map<number, string[]>;
}

export default function LaborTable({
  labores,
  campanas,
  catalogos,
  onIniciar,
  onEjecutar,
  onInsumos,
  onBitacora,
  onAsignar,
  asignados,
}: LaborTableProps) {
  const campana = (id: number) => campanas.find((item) => item.id === id);

  if (labores.length === 0) {
    return <div className="empty-state">No hay labores para mostrar.</div>;
  }

  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Labor</th>
              <th>Campaña</th>
              <th>Planificada</th>
              <th>Ejecutada</th>
              {asignados && <th>Operarios</th>}
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {labores.map((labor) => {
              const campanaLabor = campana(labor.campanaId);
              const operarios = asignados?.get(labor.id) ?? [];
              return (
                <tr key={labor.id}>
                  <td className="code-cell">{labor.tipo.replace(/_/g, ' ')}</td>
                  <td>{campanaLabor ? etiquetaCampana(campanaLabor, catalogos) : `Campaña ${labor.campanaId}`}</td>
                  <td>{formatFecha(labor.fechaPlan)}</td>
                  <td>{formatFecha(labor.fechaEjecucion)}</td>
                  {asignados && <td>{operarios.length > 0 ? operarios.join(', ') : <span className="muted">Sin asignar</span>}</td>}
                  <td><StatusBadge estado={labor.estado} /></td>
                  <td>
                    <div className="table-actions">
                      {onAsignar && laborPendiente(labor) && (
                        <button type="button" className="btn-link" onClick={() => onAsignar(labor)}>Asignar</button>
                      )}
                      {onIniciar && (labor.estado === 'PLANIFICADA' || labor.estado === 'ASIGNADA') && (
                        <button type="button" className="btn-link" onClick={() => onIniciar(labor)}>Iniciar</button>
                      )}
                      {onEjecutar && laborPendiente(labor) && (
                        <button type="button" className="btn-link" onClick={() => onEjecutar(labor)}>Ejecutar</button>
                      )}
                      <button type="button" className="btn-link" onClick={() => onInsumos(labor)}>Insumos</button>
                      <button type="button" className="btn-link" onClick={() => onBitacora(labor)}>Bitácora</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
