import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import SelectFilter from '../../../components/ui/SelectFilter';
import MotivoDialog from '../../../components/ui/MotivoDialog';
import { useCarga } from '../../../hooks/useCarga';
import { usePaginacion } from '../../../hooks/usePaginacion';
import type { ColumnaExportar } from '../../../shared/utils/exportar';
import { incidenciaAbierta } from '../../../shared/utils/estados';
import { formatFecha } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { campanaService } from '../../campanas/services/campanaService';
import { etiquetaParcela, nombreCultivo } from '../../campanas/utils/etiquetas';
import { cultivoService } from '../../cultivos/services/cultivoService';
import type { Labor } from '../../labores/models/Labor';
import { laborService } from '../../labores/services/laborService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import type { Usuario } from '../../usuarios/models/Usuario';
import { nombreUsuario, usuarioService } from '../../usuarios/services/usuarioService';
import { useAuth } from '../../auth/context/useAuth';
import StatusBadge from '../../../components/ui/StatusBadge';
import FotosPanel from '../components/FotosPanel';
import IncidenciaForm from '../components/IncidenciaForm';
import ResolverPanel from '../components/ResolverPanel';
import { nombreTipoIncidencia, TIPOS_INCIDENCIA, type Incidencia } from '../models/Incidencia';
import { incidenciaService } from '../services/incidenciaService';
import { filtrarIncidencias } from '../utils/filtrarIncidencias';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

const cargarDatos = async (signal: AbortSignal) => {
  const [incidencias, campanas, labores, predios, parcelas, cultivos, usuarios] = await Promise.all([
    incidenciaService.listar(signal),
    campanaService.listar(signal),
    laborService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    usuarioService.listar(signal),
  ]);
  return { incidencias, campanas, labores, usuarios, catalogos: { predios, parcelas, cultivos } };
};

const OPCIONES_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'ABIERTA', label: 'Abierta' },
  { value: 'EN_ATENCION', label: 'En atención' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'ANULADA', label: 'Anulada' },
];
const OPCIONES_GRAVEDAD = [
  { value: '', label: 'Todas' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];
const OPCIONES_TIPO = [{ value: '', label: 'Todos' }, ...TIPOS_INCIDENCIA.map((t) => ({ value: t.valor, label: t.nombre }))];

export default function IncidenciasPage() {
  const { datos, setDatos, loading, error } = useCarga(cargarDatos, {
    incidencias: [] as Incidencia[],
    campanas: [] as Campana[],
    labores: [] as Labor[],
    usuarios: [] as Usuario[],
    catalogos: { predios: [], parcelas: [], cultivos: [] },
  });
  const { incidencias, campanas, labores, usuarios, catalogos } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { puede } = useAuth();
  const puedeReportar = puede('incidencias.reportar');
  const puedeGestionar = puede('incidencias.gestionar');
  const [resolviendo, setResolviendo] = useState<Incidencia | null>(null);
  const [accionError, setAccionError] = useState('');
  const [anulando, setAnulando] = useState<Incidencia | null>(null);
  const [conFotos, setConFotos] = useState<Incidencia | null>(null);
  const [filtros, setFiltros] = useState({ busqueda: '', estado: '', gravedad: '', tipo: '', parcelaId: '' });
  const filtrar = (cambio: Partial<typeof filtros>) => setFiltros((prev) => ({ ...prev, ...cambio }));

  const reemplazar = (actualizada: Incidencia) =>
    setDatos((prev) => ({
      ...prev,
      incidencias: prev.incidencias.map((item) => (item.id === actualizada.id ? actualizada : item)),
    }));

  const anular = async (motivo: string) => {
    if (!anulando) return;
    reemplazar(await incidenciaService.anular(anulando.id, motivo));
    setAnulando(null);
  };

  const asignar = async (incidencia: Incidencia, usuarioId: number) => {
    setAccionError('');
    try {
      reemplazar(await incidenciaService.asignarResponsable(incidencia.id, usuarioId));
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo asignar el responsable');
    }
  };

  const atender = async (incidencia: Incidencia) => {
    setAccionError('');
    try {
      reemplazar(await incidenciaService.atender(incidencia.id));
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo atender');
    }
  };
  // Se fija al montar la página para que el conteo no cambie entre renders.
  const [haceUnaSemana] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);

  const cultivoDeCampana = (id: number | null) => {
    const campana = campanas.find((item) => item.id === id);
    return campana ? nombreCultivo(campana.cultivoId, catalogos) : '—';
  };
  const tipoLabor = (id: number | null) => labores.find((item) => item.id === id)?.tipo ?? '—';
  const parcelasAfectadas = new Set(incidencias.map((incidencia) => incidencia.parcelaId)).size;
  const abiertas = incidencias.filter(incidenciaAbierta).length;
  const ultimaSemana = incidencias.filter((incidencia) => new Date(incidencia.fecha).getTime() >= haceUnaSemana).length;
  const nombreParcela = (incidencia: Incidencia) => (incidencia.parcelaId ? etiquetaParcela(incidencia.parcelaId, catalogos) : '—');
  const responsable = (incidencia: Incidencia) => (incidencia.responsableId ? nombreUsuario(usuarios, incidencia.responsableId) : 'Sin responsable');
  const visibles = filtrarIncidencias(incidencias, filtros, (incidencia) => [
    nombreParcela(incidencia), cultivoDeCampana(incidencia.campanaId), nombreUsuario(usuarios, incidencia.usuarioId), responsable(incidencia),
  ]);
  const { pagina, props: paginacion } = usePaginacion(visibles, JSON.stringify(filtros));
  const activos = usuarios.filter((usuario) => usuario.estado === 'ACTIVO');
  const opcionesParcela = [{ value: '', label: 'Todas' }, ...catalogos.parcelas.map((parcela) => ({
    value: String(parcela.id), label: etiquetaParcela(parcela.id, catalogos),
  }))];
  const columnas: ColumnaExportar<Incidencia>[] = [
    { titulo: 'Fecha', valor: (i) => formatFecha(i.fecha) },
    { titulo: 'Tipo', valor: (i) => nombreTipoIncidencia(i.tipo) },
    { titulo: 'Gravedad', valor: (i) => i.gravedad },
    { titulo: 'Parcela', valor: nombreParcela },
    { titulo: 'Cultivo', valor: (i) => cultivoDeCampana(i.campanaId) },
    { titulo: 'Descripción', valor: (i) => i.descripcion },
    { titulo: 'Reportado por', valor: (i) => nombreUsuario(usuarios, i.usuarioId) },
    { titulo: 'Responsable', valor: responsable },
    { titulo: 'Estado', valor: (i) => i.estado },
    { titulo: 'Resolución', valor: (i) => i.resolucion },
  ];

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="CAMPO"
        titulo="Incidencias"
        descripcion="Problemas reportados en campo: plagas, clima, fallas de equipo."
        accion={
          puedeReportar ? (
            <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Reportar incidencia'}
            </Button>
          ) : undefined
        }
      />

      {puedeReportar && mostrarFormulario && (
        <IncidenciaForm
          campanas={campanas}
          labores={labores}
          catalogos={catalogos}
          onCreated={(nueva) => setDatos((prev) => ({ ...prev, incidencias: [nueva, ...prev.incidencias] }))}
        />
      )}

      {resolviendo && (
        <ResolverPanel
          key={resolviendo.id}
          incidencia={resolviendo}
          onResuelta={(resuelta) => {
            reemplazar(resuelta);
            setResolviendo(null);
          }}
          onCerrar={() => setResolviendo(null)}
        />
      )}

      {conFotos && (
        <FotosPanel
          key={conFotos.id}
          incidencia={conFotos}
          puedeAgregar={puedeReportar && incidenciaAbierta(conFotos)}
          onCerrar={() => setConFotos(null)}
        />
      )}

      {accionError && <div className="form-error">{accionError}</div>}

      {loading && <div className="state-card">Cargando incidencias...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Sin resolver', valor: abiertas },
              { etiqueta: 'Registradas', valor: incidencias.length },
              { etiqueta: 'Últimos 7 días', valor: ultimaSemana },
              { etiqueta: 'Parcelas afectadas', valor: parcelasAfectadas },
            ]}
          />
          <div className="filter-bar">
            <SearchInput label="Buscar" value={filtros.busqueda} onChange={(busqueda) => filtrar({ busqueda })} placeholder="Descripción, parcela o persona" />
            <SelectFilter label="Estado" value={filtros.estado} onChange={(estado) => filtrar({ estado })} options={OPCIONES_ESTADO} />
            <SelectFilter label="Gravedad" value={filtros.gravedad} onChange={(gravedad) => filtrar({ gravedad })} options={OPCIONES_GRAVEDAD} />
            <SelectFilter label="Tipo" value={filtros.tipo} onChange={(tipo) => filtrar({ tipo })} options={OPCIONES_TIPO} />
            <SelectFilter label="Parcela" value={filtros.parcelaId} onChange={(parcelaId) => filtrar({ parcelaId })} options={opcionesParcela} />
            <ExportarBotones titulo="Incidencias" columnas={columnas} filas={visibles} />
          </div>
          {visibles.length === 0 ? (
            <EmptyState title={incidencias.length === 0 ? 'No hay incidencias registradas.' : 'Ninguna incidencia coincide con los filtros.'} />
          ) : (
            <>
            <div className="table-card">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Tipo</th><th>Gravedad</th><th>Parcela</th><th>Descripción</th><th>Reportado por</th><th>Responsable</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {pagina.items.map((incidencia) => (
                      <tr key={incidencia.id} title={incidencia.motivoAnulacion ?? undefined}>
                        <td>{formatFecha(incidencia.fecha)}</td>
                        <td>{nombreTipoIncidencia(incidencia.tipo)}</td>
                        <td><StatusBadge estado={incidencia.gravedad} /></td>
                        <td>
                          {nombreParcela(incidencia)}
                          <small className="muted celda-nota">{[cultivoDeCampana(incidencia.campanaId), tipoLabor(incidencia.laborId)].filter((t) => t !== '—').join(' · ')}</small>
                        </td>
                        <td>{incidencia.descripcion}</td>
                        <td>{nombreUsuario(usuarios, incidencia.usuarioId)}</td>
                        <td>
                          {puedeGestionar && incidenciaAbierta(incidencia) ? (
                            <select
                              className="select-celda"
                              aria-label="Responsable"
                              value={incidencia.responsableId ?? ''}
                              onChange={(e) => asignar(incidencia, Number(e.target.value))}
                            >
                              {incidencia.responsableId === null && <option value="">Sin responsable</option>}
                              {activos.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombreCompleto}</option>)}
                            </select>
                          ) : responsable(incidencia)}
                        </td>
                        <td>
                          <StatusBadge estado={incidencia.estado} />
                          {incidencia.resolucion && <small className="muted celda-nota">{incidencia.resolucion}</small>}
                        </td>
                        <td>
                          <div className="table-actions">
                            <Button variant="secondary" size="sm" type="button" onClick={() => setConFotos(incidencia)}>Fotos</Button>
                            {puedeGestionar && incidencia.estado === 'ABIERTA' && (
                              <Button variant="secondary" size="sm" type="button" onClick={() => atender(incidencia)}>Atender</Button>
                            )}
                            {puedeGestionar && incidenciaAbierta(incidencia) && (
                              <>
                                <Button variant="secondary" size="sm" type="button" onClick={() => setResolviendo(incidencia)}>Resolver</Button>
                                <Button variant="secondary" size="sm" type="button" onClick={() => setAnulando(incidencia)}>Anular</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
        title="Anular incidencia"
        confirmLabel="Anular"
        aviso="La incidencia queda en el historial, fuera de las abiertas."
        onConfirm={anular}
        onCancel={() => setAnulando(null)}
      />
    </section>
  );
}
