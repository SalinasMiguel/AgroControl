import { useCarga } from '../../../hooks/useCarga';
import { formatFecha } from '../../../utils/formato';
import type { Labor } from '../../labores/models/Labor';
import { laborService } from '../../labores/services/laborService';
import type { Parcela } from '../../parcelas/models/Parcela';
import type { Usuario } from '../../usuarios/models/Usuario';
import { nombreUsuario, usuarioService } from '../../usuarios/services/usuarioService';
import type { EntradaBitacora } from '../models/Bitacora';
import { bitacoraService } from '../services/bitacoraService';
import Button from '../../../components/ui/Button';

interface BitacoraParcelaPanelProps {
  parcela: Parcela;
  nombrePredio: string;
  onCerrar: () => void;
}

const cargar = (parcelaId: number) => async (signal: AbortSignal) => {
  const [entradas, labores, usuarios] = await Promise.all([
    bitacoraService.listarDeParcela(parcelaId, signal),
    laborService.listar(signal),
    usuarioService.listar(signal),
  ]);
  return { entradas, labores, usuarios };
};

// RF-14: todo lo que se anotó en las labores de una parcela, en una sola línea de tiempo
export default function BitacoraParcelaPanel({ parcela, nombrePredio, onCerrar }: BitacoraParcelaPanelProps) {
  const { datos, loading, error } = useCarga(
    cargar(parcela.id),
    { entradas: [] as EntradaBitacora[], labores: [] as Labor[], usuarios: [] as Usuario[] },
    parcela.id,
  );
  const labor = (id: number) => datos.labores.find((item) => item.id === id);

  return (
    <div className="entity-form">
      <h3 className="panel-title">Bitácora de la parcela {parcela.codigo} · {nombrePredio}</h3>

      {loading && <p className="muted">Cargando bitácora...</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && datos.entradas.length === 0 && (
        <p className="muted">No hay observaciones de campo en las labores de esta parcela.</p>
      )}
      {datos.entradas.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Fecha</th><th>Labor</th><th>Observación</th><th>Registró</th></tr>
            </thead>
            <tbody>
              {datos.entradas.map((entrada) => (
                <tr key={entrada.id}>
                  <td>{formatFecha(entrada.fecha)}</td>
                  <td>{labor(entrada.laborId)?.tipo ?? `Labor #${entrada.laborId}`}</td>
                  <td>{entrada.observacion}</td>
                  <td>{nombreUsuario(datos.usuarios, entrada.usuarioId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCerrar}>Cerrar</Button>
      </div>
    </div>
  );
}
