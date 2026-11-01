import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatArea } from '../../../utils/area';
import type { Predio } from '../../predios/models/Predio';
import type { Parcela } from '../models/Parcela';

interface ParcelaTableProps {
  parcelas: Parcela[];
  // Map construido una vez en la página (useMemo): nombre del predio sin find ni request por fila.
  prediosPorId: Map<number, Predio>;
  // Sin handlers (rol de solo lectura) no se muestra la columna de acciones
  onEditar?: (parcela: Parcela) => void;
  onEliminar?: (parcela: Parcela) => void;
  onBitacora?: (parcela: Parcela) => void;
  onFicha?: (parcela: Parcela) => void;
  deletingId?: number | null;
}

export default function ParcelaTable({ parcelas, prediosPorId, onEditar, onEliminar, onBitacora, onFicha, deletingId = null }: ParcelaTableProps) {
  const conAcciones = Boolean(onEditar || onEliminar || onBitacora || onFicha);
  const obtenerNombrePredio = (predioId: number) => prediosPorId.get(predioId)?.nombre ?? `Predio #${predioId}`;

  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Predio</th>
              <th>Área</th>
              <th>Estado</th>
              {conAcciones && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {parcelas.map((parcela) => (
              <tr key={parcela.id}>
                <td className="code-cell">{parcela.codigo}</td>
                <td>{obtenerNombrePredio(parcela.predioId)}</td>
                <td>{formatArea(parcela.areaHa)}</td>
                <td><StatusBadge estado={parcela.estado} /></td>
                {conAcciones && (
                  <td>
                    <div className="table-actions">
                      {onFicha && <Button variant="secondary" size="sm" onClick={() => onFicha(parcela)}>Ficha</Button>}
                      {onBitacora && <Button variant="secondary" size="sm" onClick={() => onBitacora(parcela)}>Bitácora</Button>}
                      {onEditar && <Button variant="secondary" size="sm" onClick={() => onEditar(parcela)}>Editar</Button>}
                      {onEliminar && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onEliminar(parcela)}
                          loading={deletingId === parcela.id}
                          loadingText="Eliminando..."
                        >
                          Eliminar
                        </Button>
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
