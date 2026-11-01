import StatusBadge from '../../../components/ui/StatusBadge';
import { campanaAbierta } from '../../../shared/utils/estados';
import { diasAtraso } from '../../../shared/utils/resumenInicio';
import { formatArea } from '../../../utils/area';
import { formatFecha, hoyISO } from '../../../utils/formato';
import type { Campana } from '../models/Campana';
import { etiquetaParcela, nombreCultivo, type Catalogos } from '../utils/etiquetas';
import { superficie } from '../utils/rendimiento';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

interface CampanaTableProps {
  campanas: Campana[];
  catalogos: Catalogos;
  // Toneladas por hectárea, por id de campaña
  rendimientos?: Record<number, number>;
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
  rendimientos = {},
  onEditar,
  onIniciar,
  onCancelar,
  onFinalizar,
  onMarcarPerdida,
  onReabrir,
  onAvance,
}: CampanaTableProps) {
  const conAcciones = Boolean(onIniciar || onFinalizar || onAvance);

  const hoy = hoyISO();

  if (campanas.length === 0) {
    return <EmptyState title="No hay campañas registradas." />;
  }

  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Parcela</th>
              <th>Sembrado</th>
              <th>Inicio</th>
              <th>Cosecha</th>
              <th>Rendimiento</th>
              <th>Estado</th>
              {conAcciones && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {campanas.map((campana) => {
              const abierta = campanaAbierta(campana);
              const atraso = abierta && campana.fechaCosechaEstimada ? diasAtraso(campana.fechaCosechaEstimada, hoy) : 0;
              const rendimiento = rendimientos[campana.id];
              return (
              <tr key={campana.id} title={campana.motivoCierre ?? undefined}>
                <td>
                  <strong>{nombreCultivo(campana.cultivoId, catalogos)}</strong>
                  <small className="celda-nota muted">{campana.variedad ?? `Campaña ${campana.fechaInicio.slice(0, 4)}`}</small>
                </td>
                <td>{etiquetaParcela(campana.parcelaId, catalogos)}</td>
                <td>{formatArea(superficie(campana, catalogos.parcelas))}</td>
                <td>{formatFecha(campana.fechaInicio)}</td>
                <td>
                  {formatFecha(abierta ? campana.fechaCosechaEstimada : campana.fechaFin)}
                  {abierta && campana.fechaCosechaEstimada && <small className="celda-nota muted">estimada</small>}
                  {atraso > 0 && <small className="celda-nota field-error">Atrasada · {atraso} días</small>}
                </td>
                <td>{rendimiento ? `${rendimiento.toFixed(2).replace('.', ',')} t/ha` : '—'}</td>
                <td><StatusBadge estado={campana.estado} /></td>
                {conAcciones && (
                <td>
                  <div className="table-actions">
                    {onEditar && abierta && (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
