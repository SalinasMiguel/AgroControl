import { Link, useNavigate, useParams } from 'react-router';
import PageHeading from '../../../components/common/PageHeading';
import EmptyState from '../../../components/ui/EmptyState';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useCarga } from '../../../hooks/useCarga';
import { formatCantidad, formatFecha } from '../../../utils/formato';
import { cosechaService } from '../../cosechas/services/cosechaService';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { nombreTipoIncidencia } from '../../incidencias/models/Incidencia';
import { incidenciaService } from '../../incidencias/services/incidenciaService';
import { laborService } from '../../labores/services/laborService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import AvancePanel from '../components/AvancePanel';
import { campanaService } from '../services/campanaService';
import { etiquetaCampana, type Catalogos } from '../utils/etiquetas';

const cargar = async (signal: AbortSignal) => {
  const [campanas, predios, parcelas, cultivos, labores, cosechas, incidencias] = await Promise.all([
    campanaService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    laborService.listar(signal),
    cosechaService.listar(signal),
    incidenciaService.listar(signal),
  ]);
  return { campanas, labores, cosechas, incidencias, catalogos: { predios, parcelas, cultivos } as Catalogos };
};

interface Evento {
  fecha: string;
  tipo: string;
  detalle: string;
  estado: string;
}

// Todo lo de una campaña en una pantalla: avance, insumos, labores, cosecha e incidencias.
export default function FichaCampanaPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { datos, loading, error } = useCarga(cargar, {
    campanas: [],
    labores: [],
    cosechas: [],
    incidencias: [],
    catalogos: { predios: [], parcelas: [], cultivos: [] } as Catalogos,
  } as Awaited<ReturnType<typeof cargar>>);
  const campana = datos.campanas.find((item) => item.id === id);

  if (loading) return <div className="state-card">Cargando ficha...</div>;
  if (error) return <div className="state-card error">{error}</div>;
  if (!campana) return <EmptyState title="No existe esa campaña." />;

  const titulo = etiquetaCampana(campana, datos.catalogos);
  const labores = datos.labores.filter((labor) => labor.campanaId === id);
  const cosechas = datos.cosechas.filter((cosecha) => cosecha.campanaId === id);
  const incidencias = datos.incidencias.filter((incidencia) => incidencia.campanaId === id);
  const historial: Evento[] = [
    ...labores.map((l) => ({ fecha: l.fechaEjecucion ?? l.fechaPlan, tipo: 'Labor', detalle: l.tipo.replace(/_/g, ' '), estado: l.estado })),
    ...cosechas.map((c) => ({ fecha: c.fecha, tipo: 'Cosecha', detalle: formatCantidad(c.cantidad, c.unidadMedida), estado: c.anulado ? 'ANULADA' : 'REGISTRADA' })),
    ...incidencias.map((i) => ({ fecha: i.fecha, tipo: `Incidencia · ${nombreTipoIncidencia(i.tipo)}`, detalle: i.descripcion, estado: i.estado })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <section className="feature-page">
      <PageHeading eyebrow="FICHA DE CAMPAÑA" titulo={titulo} descripcion={`Inicio ${formatFecha(campana.fechaInicio)}${campana.variedad ? ` · Variedad ${campana.variedad}` : ''}`} />
      <p><Link to="/campanas">← Volver a campañas</Link> · <Link to={`/parcelas/${campana.parcelaId}`}>Ver parcela</Link></p>
      <AvancePanel campana={campana} titulo={titulo} onCerrar={() => navigate('/campanas')} />
      <div className="barra-resultados">
        <h2 className="ficha-seccion">Historial</h2>
        <ExportarBotones
          titulo={`Campaña ${titulo}`}
          filas={historial}
          columnas={[
            { titulo: 'Fecha', valor: (e) => formatFecha(e.fecha) },
            { titulo: 'Tipo', valor: (e) => e.tipo },
            { titulo: 'Detalle', valor: (e) => e.detalle },
            { titulo: 'Estado', valor: (e) => e.estado.replace(/_/g, ' ') },
          ]}
        />
      </div>
      {historial.length === 0 ? (
        <EmptyState title="Esta campaña todavía no tiene movimientos." />
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Detalle</th><th>Estado</th></tr></thead>
              <tbody>
                {historial.map((evento, i) => (
                  <tr key={i}>
                    <td>{formatFecha(evento.fecha)}</td>
                    <td>{evento.tipo}</td>
                    <td>{evento.detalle}</td>
                    <td><StatusBadge estado={evento.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
