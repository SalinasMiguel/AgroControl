import StatusBadge from '../../../components/ui/StatusBadge';
import { formatFecha } from '../../../utils/formato';
import type { Campana } from '../models/Campana';
import { etiquetaParcela, nombreCultivo, type Catalogos } from '../utils/etiquetas';

interface CampanaTableProps {
  campanas: Campana[];
  catalogos: Catalogos;
  // Sin handlers (rol de solo lectura) no se muestra la columna de acciones
  onEditar?: (campana: Campana) => void;
  onIniciar?: (campana: Campana) => void;
  onCancelar?: (campana: Campana) => void;
  onFinalizar?: (campana: Campana) => void;
  onMarcarPerdida?: (campana: Campana) => void;
  onReabrir?: (campana: Campana) => void;
  onAvance?: (campana: Campana) => void;
}

export default function CampanaTable({
  campanas,
  catalogos,
  onEditar,
  onIniciar,
  onCancelar,
  onFinalizar,
  onMarcarPerdida,
  onReabrir,
  onAvance,
}: CampanaTableProps) {
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
              <tr key={campana.id} title={campana.motivoCierre ?? undefined}>
                <td>{campana.id}</td>
                <td>{etiquetaParcela(campana.parcelaId, catalogos)}</td>
                <td>{nombreCultivo(campana.cultivoId, catalogos)}</td>
                <td>{formatFecha(campana.fechaInicio)}</td>
                <td>{formatFecha(campana.fechaFin)}</td>
                <td><StatusBadge estado={campana.estado} /></td>
                {conAcciones && (
                <td>
                  <div className="table-actions">
                    {onEditar && campana.estado === 'PLANIFICADA' && (
                      <button type="button" className="btn-link" onClick={() => onEditar(campana)}>Editar</button>
                    )}
                    {onIniciar && campana.estado === 'PLANIFICADA' && (
                      <button type="button" className="btn-link" onClick={() => onIniciar(campana)}>Iniciar</button>
                    )}
                    {onCancelar && campana.estado === 'PLANIFICADA' && (
                      <button type="button" className="btn-link" onClick={() => onCancelar(campana)}>Cancelar</button>
                    )}
                    {onFinalizar && campana.estado === 'EN_CURSO' && (
                      <button type="button" className="btn-link" onClick={() => onFinalizar(campana)}>Finalizar</button>
                    )}
                    {onMarcarPerdida && campana.estado === 'EN_CURSO' && (
                      <button type="button" className="btn-link" onClick={() => onMarcarPerdida(campana)}>Marcar perdida</button>
                    )}
                    {onReabrir && (campana.estado === 'FINALIZADA' || campana.estado === 'PERDIDA') && (
                      <button type="button" className="btn-link" onClick={() => onReabrir(campana)}>Reabrir</button>
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
