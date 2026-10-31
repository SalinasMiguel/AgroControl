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
  onEditar?: (labor: Labor) => void;
  onIniciar?: (labor: Labor) => void;
  onEjecutar?: (labor: Labor) => void;
  onCancelar?: (labor: Labor) => void;
  onReabrir?: (labor: Labor) => void;
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
  onEditar,
  onIniciar,
  onEjecutar,
  onCancelar,
  onReabrir,
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
                <tr key={labor.id} title={labor.motivoCancelacion ?? undefined}>
                  <td className="code-cell">{labor.tipo.replace(/_/g, ' ')}</td>
                  <td>{campanaLabor ? etiquetaCampana(campanaLabor, catalogos) : `Campaña ${labor.campanaId}`}</td>
                  <td>{formatFecha(labor.fechaPlan)}</td>
                  <td>{formatFecha(labor.fechaEjecucion)}</td>
                  {asignados && <td>{operarios.length > 0 ? operarios.join(', ') : <span className="muted">Sin asignar</span>}</td>}
                  <td><StatusBadge estado={labor.estado} /></td>
                  <td>
                    <div className="table-actions">
                      {onEditar && (labor.estado === 'PLANIFICADA' || labor.estado === 'ASIGNADA') && (
                        <button type="button" className="btn-link" onClick={() => onEditar(labor)}>Editar</button>
                      )}
                      {onAsignar && laborPendiente(labor) && (
                        <button type="button" className="btn-link" onClick={() => onAsignar(labor)}>Asignar</button>
                      )}
                      {onIniciar && (labor.estado === 'PLANIFICADA' || labor.estado === 'ASIGNADA') && (
                        <button type="button" className="btn-link" onClick={() => onIniciar(labor)}>Iniciar</button>
                      )}
                      {onEjecutar && laborPendiente(labor) && (
                        <button type="button" className="btn-link" onClick={() => onEjecutar(labor)}>Ejecutar</button>
                      )}
                      {onCancelar && laborPendiente(labor) && (
                        <button type="button" className="btn-link" onClick={() => onCancelar(labor)}>Cancelar</button>
                      )}
                      {onReabrir && labor.estado === 'EJECUTADA' && (
                        <button type="button" className="btn-link" onClick={() => onReabrir(labor)}>Reabrir</button>
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
