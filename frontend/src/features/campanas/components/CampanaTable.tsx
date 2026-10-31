import StatusBadge from '../../../components/ui/StatusBadge';
import { formatFecha } from '../../../utils/formato';
import type { Campana } from '../models/Campana';
import { etiquetaParcela, nombreCultivo, type Catalogos } from '../utils/etiquetas';

interface CampanaTableProps {
  campanas: Campana[];
  catalogos: Catalogos;
  // Sin handlers (rol de solo lectura) no se muestra la columna de acciones
  onIniciar?: (campana: Campana) => void;
  onFinalizar?: (campana: Campana) => void;
  onAvance?: (campana: Campana) => void;
}

export default function CampanaTable({ campanas, catalogos, onIniciar, onFinalizar, onAvance }: CampanaTableProps) {
  const conAcciones = Boolean(onIniciar || onFinalizar || onAvance);

  if (campanas.length === 0) {
    return <div className="empty-state">No hay campañas registradas.</div>;
  }

  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Parcela</th>
              <th>Cultivo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              {conAcciones && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {campanas.map((campana) => (
              <tr key={campana.id}>
                <td>{campana.id}</td>
                <td>{etiquetaParcela(campana.parcelaId, catalogos)}</td>
                <td>{nombreCultivo(campana.cultivoId, catalogos)}</td>
                <td>{formatFecha(campana.fechaInicio)}</td>
                <td>{formatFecha(campana.fechaFin)}</td>
                <td><StatusBadge estado={campana.estado} /></td>
                {conAcciones && (
                <td>
                  <div className="table-actions">
                    {onIniciar && campana.estado === 'PLANIFICADA' && (
                      <button type="button" className="btn-link" onClick={() => onIniciar(campana)}>Iniciar</button>
                    )}
                    {onFinalizar && campana.estado === 'EN_CURSO' && (
                      <button type="button" className="btn-link" onClick={() => onFinalizar(campana)}>Finalizar</button>
                    )}
                    {onAvance && (
                      <button type="button" className="btn-link" onClick={() => onAvance(campana)}>Avance</button>
                    )}
                  </div>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
