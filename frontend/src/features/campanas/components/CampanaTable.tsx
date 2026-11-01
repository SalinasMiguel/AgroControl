import StatusBadge from '../../../components/ui/StatusBadge';
import { formatFecha } from '../../../utils/formato';
import type { Campana } from '../models/Campana';
import { etiquetaParcela, nombreCultivo, type Catalogos } from '../utils/etiquetas';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

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
    return <EmptyState title="No hay campañas registradas." />;
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
                      <Button variant="secondary" size="sm" type="button" onClick={() => onEditar(campana)}>Editar</Button>
                    )}
                    {onIniciar && campana.estado === 'PLANIFICADA' && (
                      <Button variant="secondary" size="sm" type="button" onClick={() => onIniciar(campana)}>Iniciar</Button>
                    )}
                    {onCancelar && campana.estado === 'PLANIFICADA' && (
                      <Button variant="secondary" size="sm" type="button" onClick={() => onCancelar(campana)}>Cancelar</Button>
                    )}
                    {onFinalizar && campana.estado === 'EN_CURSO' && (
                      <Button variant="secondary" size="sm" type="button" onClick={() => onFinalizar(campana)}>Finalizar</Button>
                    )}
                    {onMarcarPerdida && campana.estado === 'EN_CURSO' && (
                      <Button variant="secondary" size="sm" type="button" onClick={() => onMarcarPerdida(campana)}>Marcar perdida</Button>
                    )}
                    {onReabrir && (campana.estado === 'FINALIZADA' || campana.estado === 'PERDIDA') && (
                      <Button variant="secondary" size="sm" type="button" onClick={() => onReabrir(campana)}>Reabrir</Button>
                    )}
                    {onAvance && (
                      <Button variant="secondary" size="sm" type="button" onClick={() => onAvance(campana)}>Avance</Button>
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
