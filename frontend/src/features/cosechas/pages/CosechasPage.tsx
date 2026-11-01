import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import MotivoDialog from '../../../components/ui/MotivoDialog';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import SelectFilter from '../../../components/ui/SelectFilter';
import { useCarga } from '../../../hooks/useCarga';
import { usePaginacion } from '../../../hooks/usePaginacion';
import type { ColumnaExportar } from '../../../shared/utils/exportar';
import { sinAnulados } from '../../../shared/utils/estados';
import { formatCantidad, formatFecha } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { campanaService } from '../../campanas/services/campanaService';
import { etiquetaCampana, etiquetaParcela } from '../../campanas/utils/etiquetas';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import type { Usuario } from '../../usuarios/models/Usuario';
import { nombreUsuario, usuarioService } from '../../usuarios/services/usuarioService';
import { useAuth } from '../../auth/context/useAuth';
import CosechaForm from '../components/CosechaForm';
import type { Cosecha } from '../models/Cosecha';
import { cosechaService } from '../services/cosechaService';
import { filtrarCosechas, totalesPorUnidad } from '../utils/filtrarCosechas';
import { toneladasNetas } from '../utils/neto';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

const cargarDatos = async (signal: AbortSignal) => {
  const [cosechas, campanas, predios, parcelas, cultivos, usuarios] = await Promise.all([
    cosechaService.listar(signal),
    campanaService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    usuarioService.listar(signal),
  ]);
  return { cosechas, campanas, usuarios, catalogos: { predios, parcelas, cultivos } };
};

const porcentaje = (valor: number | null) => (valor === null ? '—' : `${String(valor).replace('.', ',')} %`);

export default function CosechasPage() {
  const { datos, setDatos, loading, error, recargar } = useCarga(cargarDatos, {
    cosechas: [] as Cosecha[],
    campanas: [] as Campana[],
    usuarios: [] as Usuario[],
    catalogos: { predios: [], parcelas: [], cultivos: [] },
  });
  const { cosechas, campanas, usuarios, catalogos } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeRegistrar = useAuth().puede('cosechas.registrar');
  const [anulando, setAnulando] = useState<Cosecha | null>(null);
  const [corrigiendo, setCorrigiendo] = useState<Cosecha | null>(null);
  const [filtros, setFiltros] = useState({ busqueda: '', campanaId: '', parcelaId: '', desde: '', hasta: '' });
  const filtrar = (cambio: Partial<typeof filtros>) => setFiltros((prev) => ({ ...prev, ...cambio }));

  const anular = async (motivo: string) => {
    if (!anulando) return;
    const anulada = await cosechaService.anular(anulando.id, motivo);
    setDatos((prev) => ({
      ...prev,
      cosechas: prev.cosechas.map((item) => (item.id === anulada.id ? anulada : item)),
    }));
    setAnulando(null);
  };

  const campana = (id: number) => campanas.find((item) => item.id === id);
  const nombreCampana = (id: number) => {
    const encontrada = campana(id);
    return encontrada ? etiquetaCampana(encontrada, catalogos) : `Campaña ${id}`;
  };
  const netas = (cosecha: Cosecha) => {
    const cultivoId = campana(cosecha.campanaId)?.cultivoId;
    return toneladasNetas(cosecha, catalogos.cultivos.find((c) => c.id === cultivoId)?.humedadEstandarPct ?? null);
  };
  const visibles = filtrarCosechas(cosechas, filtros, (c) => campana(c.campanaId)?.parcelaId, (c) => nombreCampana(c.campanaId));
  const { pagina, props: paginacion } = usePaginacion(visibles, JSON.stringify(filtros));
  // Los totales son de lo filtrado: así el filtro por campaña responde "¿cuánto salió de aquí?"
  const vigentes = sinAnulados(visibles);
  const toneladas = vigentes.reduce((suma, c) => suma + c.toneladas, 0);
  const totalNetas = vigentes.reduce((suma, c) => suma + netas(c), 0);
  const campanasCosechadas = new Set(vigentes.map((cosecha) => cosecha.campanaId)).size;
  const opcionesCampana = [{ value: '', label: 'Todas' }, ...campanas.map((c) => ({ value: String(c.id), label: etiquetaCampana(c, catalogos) }))];
  const opcionesParcela = [{ value: '', label: 'Todas' }, ...catalogos.parcelas.map((p) => ({ value: String(p.id), label: etiquetaParcela(p.id, catalogos) }))];
  const columnas: ColumnaExportar<Cosecha>[] = [
    { titulo: 'Fecha', valor: (c) => formatFecha(c.fecha) },
    { titulo: 'Boleta', valor: (c) => c.numeroBoleta },
    { titulo: 'Campaña', valor: (c) => nombreCampana(c.campanaId) },
    { titulo: 'Cantidad', valor: (c) => c.cantidad },
    { titulo: 'Unidad', valor: (c) => c.unidadMedida },
    { titulo: 'Toneladas', valor: (c) => c.toneladas },
    { titulo: 'Toneladas netas', valor: (c) => Math.round(netas(c) * 1000) / 1000 },
    { titulo: 'Humedad %', valor: (c) => c.humedadPct },
    { titulo: 'Impurezas %', valor: (c) => c.impurezasPct },
    { titulo: 'Registrado por', valor: (c) => nombreUsuario(usuarios, c.usuarioId) },
    { titulo: 'Anulada', valor: (c) => (c.anulado ? `Sí: ${c.motivoAnulacion ?? ''}` : 'No') },
  ];

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="RESULTADOS"
        titulo="Cosechas"
        descripcion="Producción obtenida por campaña y quién la registró."
        accion={
          puedeRegistrar ? (
            <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Registrar cosecha'}
            </Button>
          ) : undefined
        }
      />

      {puedeRegistrar && mostrarFormulario && (
        <CosechaForm
          campanas={campanas}
          catalogos={catalogos}
          onCreated={(nueva) => setDatos((prev) => ({ ...prev, cosechas: [nueva, ...prev.cosechas] }))}
        />
      )}

      {corrigiendo && (
        <CosechaForm
          key={corrigiendo.id}
          campanas={campanas}
          catalogos={catalogos}
          corrigiendo={corrigiendo}
          onCreated={() => {
            setCorrigiendo(null);
            recargar();
          }}
          onCerrar={() => setCorrigiendo(null)}
        />
      )}

      {loading && <div className="state-card">Cargando cosechas...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Registros', valor: vigentes.length },
              { etiqueta: 'Campañas cosechadas', valor: campanasCosechadas },
              { etiqueta: 'Total en toneladas', valor: formatCantidad(toneladas, 't') },
              { etiqueta: 'Neto (humedad e impurezas)', valor: formatCantidad(totalNetas, 't') },
              ...totalesPorUnidad(vigentes).filter((t) => t.unidad !== 't').map((t) => ({ etiqueta: `Cargado en ${t.unidad}`, valor: formatCantidad(t.total, t.unidad) })),
            ]}
          />
          <div className="filter-bar">
            <SearchInput label="Buscar" value={filtros.busqueda} onChange={(busqueda) => filtrar({ busqueda })} placeholder="Boleta o campaña" />
            <SelectFilter label="Campaña" value={filtros.campanaId} onChange={(campanaId) => filtrar({ campanaId })} options={opcionesCampana} />
            <SelectFilter label="Parcela" value={filtros.parcelaId} onChange={(parcelaId) => filtrar({ parcelaId })} options={opcionesParcela} />
            <div className="filter-field"><label htmlFor="cosecha-desde">Desde</label><input id="cosecha-desde" type="date" value={filtros.desde} onChange={(e) => filtrar({ desde: e.target.value })} /></div>
            <div className="filter-field"><label htmlFor="cosecha-hasta">Hasta</label><input id="cosecha-hasta" type="date" value={filtros.hasta} onChange={(e) => filtrar({ hasta: e.target.value })} /></div>
            <ExportarBotones titulo="Cosechas" columnas={columnas} filas={visibles} />
          </div>
          {visibles.length === 0 ? (
            <EmptyState title={cosechas.length === 0 ? 'No hay cosechas registradas.' : 'Ninguna cosecha coincide con los filtros.'} />
          ) : (
            <>
            <div className="table-card">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Boleta</th><th>Campaña</th><th>Cantidad</th><th>Neto</th><th>Humedad</th><th>Impurezas</th><th>Registrado por</th>{puedeRegistrar && <th>Acciones</th>}</tr>
                  </thead>
                  <tbody>
                    {pagina.items.map((cosecha) => {
                      return (
                        <tr key={cosecha.id} className={cosecha.anulado ? 'fila-anulada' : undefined} title={cosecha.motivoAnulacion ?? undefined}>
                          <td>{formatFecha(cosecha.fecha)}</td>
                          <td className={cosecha.numeroBoleta ? 'code-cell' : 'muted'}>{cosecha.numeroBoleta ?? '—'}</td>
                          <td>{nombreCampana(cosecha.campanaId)}</td>
                          <td className="code-cell">{formatCantidad(cosecha.cantidad, cosecha.unidadMedida)}</td>
                          <td className="code-cell">{formatCantidad(netas(cosecha), 't')}</td>
                          <td>{porcentaje(cosecha.humedadPct)}</td>
                          <td>{porcentaje(cosecha.impurezasPct)}</td>
                          <td>{nombreUsuario(usuarios, cosecha.usuarioId)}</td>
                          {puedeRegistrar && (
                            <td>
                              {!cosecha.anulado && (
                                <div className="table-actions">
                                  <Button variant="secondary" size="sm" type="button" onClick={() => setCorrigiendo(cosecha)}>Corregir</Button>
                                  <Button variant="secondary" size="sm" type="button" onClick={() => setAnulando(cosecha)}>Anular</Button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination {...paginacion} />
            </>
          )}
        </>
      )}

      <MotivoDialog
        open={anulando !== null}
        title="Anular cosecha"
        confirmLabel="Anular"
        aviso="La cosecha sale de los totales y queda en el historial."
        onConfirm={anular}
        onCancel={() => setAnulando(null)}
      />
    </section>
  );
}
