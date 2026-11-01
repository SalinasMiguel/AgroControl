import StatusBadge from '../../../components/ui/StatusBadge';
import { formatFecha } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { etiquetaCampana, type Catalogos } from '../../campanas/utils/etiquetas';
import type { Labor } from '../models/Labor';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

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
    return <EmptyState title="No hay labores para mostrar." />;
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
                      {onAsignar && labor.estado !== 'EJECUTADA' && (
                        <Button variant="secondary" size="sm" type="button" onClick={() => onAsignar(labor)}>Asignar</Button>
                      )}
                      {onIniciar && labor.estado === 'PLANIFICADA' && (
                        <Button variant="secondary" size="sm" type="button" onClick={() => onIniciar(labor)}>Iniciar</Button>
                      )}
                      {onEjecutar && labor.estado !== 'EJECUTADA' && (
                        <Button variant="secondary" size="sm" type="button" onClick={() => onEjecutar(labor)}>Ejecutar</Button>
                      )}
                      <Button variant="secondary" size="sm" type="button" onClick={() => onInsumos(labor)}>Insumos</Button>
                      <Button variant="secondary" size="sm" type="button" onClick={() => onBitacora(labor)}>Bitácora</Button>
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
