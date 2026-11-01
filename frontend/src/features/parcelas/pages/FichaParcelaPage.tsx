import { Link, useParams } from 'react-router';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import EmptyState from '../../../components/ui/EmptyState';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useCarga } from '../../../hooks/useCarga';
import { campanaAbierta, incidenciaAbierta } from '../../../shared/utils/estados';
import { formatArea } from '../../../utils/area';
import { formatFecha } from '../../../utils/formato';
import { campanaService } from '../../campanas/services/campanaService';
import { etiquetaParcela, nombreCultivo, type Catalogos } from '../../campanas/utils/etiquetas';
import { rendimientos } from '../../campanas/utils/rendimiento';
import { cosechaService } from '../../cosechas/services/cosechaService';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { incidenciaService } from '../../incidencias/services/incidenciaService';
import { predioService } from '../../predios/services/predioService';
import { parcelaService } from '../services/parcelaService';

const cargar = async (signal: AbortSignal) => {
  const [campanas, predios, parcelas, cultivos, cosechas, incidencias] = await Promise.all([
    campanaService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    cosechaService.listar(signal),
    incidenciaService.listar(signal),
  ]);
  return { campanas, cosechas, incidencias, catalogos: { predios, parcelas, cultivos } as Catalogos };
};

const t = (valor: number | undefined) => (valor ? `${valor.toFixed(2).replace('.', ',')} t/ha` : '—');

// Qué tiene sembrado una parcela y cómo le fue en cada campaña.
export default function FichaParcelaPage() {
  const id = Number(useParams().id);
  const { datos, loading, error } = useCarga(cargar, {
    campanas: [],
    cosechas: [],
    incidencias: [],
    catalogos: { predios: [], parcelas: [], cultivos: [] } as Catalogos,
  } as Awaited<ReturnType<typeof cargar>>);
  const parcela = datos.catalogos.parcelas.find((item) => item.id === id);

  if (loading) return <div className="state-card">Cargando ficha...</div>;
  if (error) return <div className="state-card error">{error}</div>;
  if (!parcela) return <EmptyState title="No existe esa parcela." />;

  const { catalogos } = datos;
  const campanas = datos.campanas.filter((c) => c.parcelaId === id).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
  const actual = campanas.find(campanaAbierta);
  const porCampana = rendimientos(campanas, datos.cosechas, catalogos.parcelas, catalogos.cultivos);
  const abiertas = datos.incidencias.filter((i) => i.parcelaId === id && incidenciaAbierta(i)).length;
  const conRendimiento = Object.values(porCampana);
  const mejor = conRendimiento.length > 0 ? Math.max(...conRendimiento) : undefined;

  return (
    <section className="feature-page">
      <PageHeading eyebrow="FICHA DE PARCELA" titulo={etiquetaParcela(id, catalogos)} descripcion={`${formatArea(parcela.areaHa)} · ${parcela.estado.replace(/_/g, ' ').toLowerCase()}`} />
      <p><Link to="/parcelas">← Volver a parcelas</Link></p>
      <StatsGrid
        stats={[
          { etiqueta: 'Sembrado ahora', valor: actual ? nombreCultivo(actual.cultivoId, catalogos) : 'Nada' },
          { etiqueta: 'Campañas', valor: campanas.length },
          { etiqueta: 'Mejor rendimiento', valor: t(mejor) },
          { etiqueta: 'Incidencias abiertas', valor: abiertas },
        ]}
      />
      <div className="barra-resultados">
        <h2 className="ficha-seccion">Historial de campañas</h2>
        <ExportarBotones
          titulo={`Parcela ${etiquetaParcela(id, catalogos)}`}
          filas={campanas}
          columnas={[
            { titulo: 'Cultivo', valor: (c) => nombreCultivo(c.cultivoId, catalogos) },
            { titulo: 'Variedad', valor: (c) => c.variedad },
            { titulo: 'Inicio', valor: (c) => formatFecha(c.fechaInicio) },
            { titulo: 'Fin', valor: (c) => formatFecha(c.fechaFin) },
            { titulo: 'Rendimiento', valor: (c) => t(porCampana[c.id]) },
            { titulo: 'Estado', valor: (c) => c.estado },
          ]}
        />
      </div>
      {campanas.length === 0 ? (
        <EmptyState title="Esta parcela todavía no tuvo campañas." />
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Cultivo</th><th>Inicio</th><th>Fin</th><th>Rendimiento</th><th>Estado</th></tr></thead>
              <tbody>
                {campanas.map((campana) => (
                  <tr key={campana.id}>
                    <td><Link to={`/campanas/${campana.id}`}>{nombreCultivo(campana.cultivoId, catalogos)}</Link></td>
                    <td>{formatFecha(campana.fechaInicio)}</td>
                    <td>{formatFecha(campana.fechaFin)}</td>
                    <td>{t(porCampana[campana.id])}</td>
                    <td><StatusBadge estado={campana.estado} /></td>
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
