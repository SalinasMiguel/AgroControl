import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import SelectFilter from '../../../components/ui/SelectFilter';
import { useMensajeExito } from '../../../hooks/useMensajeExito';
import { isAbortError } from '../../../shared/utils/isAbortError';
import { paginar } from '../../../shared/utils/paginar';
import { formatArea } from '../../../utils/area';
import { useAuth } from '../../auth/context/useAuth';
import ParcelaForm from '../components/ParcelaForm';
import BitacoraParcelaPanel from '../../bitacora/components/BitacoraParcelaPanel';
import ParcelaTable from '../components/ParcelaTable';
import { useParcelas } from '../hooks/useParcelas';
import { ESTADOS_PARCELA, type EstadoParcela, type Parcela } from '../models/Parcela';
import { parcelaService } from '../services/parcelaService';
import { filtrarParcelas } from '../utils/filtrarParcelas';

const OPCIONES_ESTADO = [
  { value: '', label: 'Todos los estados' },
  ...ESTADOS_PARCELA.map((estado) => ({ value: estado, label: estado.replace(/_/g, ' ') })),
];

export default function ParcelasPage() {
  const { parcelas, predios, setParcelas, loading, error } = useParcelas();
  const { puede } = useAuth();
  const puedeEditar = puede('parcelas.editar');
  const puedeVerBitacora = puede('parcelas.verBitacora');
  const [bitacoraDe, setBitacoraDe] = useState<Parcela | null>(null);
  const { successMessage, mostrarExito } = useMensajeExito();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Parcela | null>(null);
  const [accionError, setAccionError] = useState('');
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Parcela | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [predioFiltro, setPredioFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoParcela | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const detalleRef = useRef<AbortController | null>(null);

  // Si la página se desmonta con un GET de detalle en vuelo, se cancela.
  useEffect(() => () => detalleRef.current?.abort(), []);

  // Un solo Map por lista de predios: lo usan la búsqueda por nombre de predio y la tabla.
  const prediosPorId = useMemo(() => new Map(predios.map((predio) => [predio.id, predio])), [predios]);

  // Todo derivado en el render: primero se filtra (sin pedir nada nuevo al backend) y después se pagina.
  const parcelasFiltradas = filtrarParcelas(parcelas, prediosPorId, {
    busqueda,
    predioId: predioFiltro ? Number(predioFiltro) : null,
    estado: estadoFiltro,
  });
  const pagina = paginar(parcelasFiltradas, page, pageSize);

  const total = parcelas.length;
  const disponibles = parcelas.filter((parcela) => parcela.estado === 'DISPONIBLE').length;
  const areaTotal = parcelas.reduce((suma, parcela) => suma + (parcela.areaHa ?? 0), 0);

  const opcionesPredio = [
    { value: '', label: 'Todos los predios' },
    ...predios.map((predio) => ({ value: String(predio.id), label: predio.nombre })),
  ];

  // Cualquier cambio de búsqueda, filtro o tamaño vuelve a la página 1.
  const cambiarBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPage(1);
  };
  const cambiarPredioFiltro = (valor: string) => {
    setPredioFiltro(valor);
    setPage(1);
  };
  const cambiarEstadoFiltro = (valor: string) => {
    setEstadoFiltro(valor as EstadoParcela | '');
    setPage(1);
  };
  const cambiarPageSize = (valor: number) => {
    setPageSize(valor);
    setPage(1);
  };

  const abrirNueva = () => {
    setEditando(null);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(null);
  };

  // Editar parte de los datos frescos del backend (GET /parcelas/{id}); si ya no existe, no se abre el formulario.
  const editar = async (parcela: Parcela) => {
    detalleRef.current?.abort();
    const controller = new AbortController();
    detalleRef.current = controller;
    try {
      setAccionError('');
      setCargandoDetalle(true);
      const detalle = await parcelaService.obtenerPorId(parcela.id, controller.signal);
      setEditando(detalle);
      setMostrarFormulario(true);
    } catch (err) {
      if (isAbortError(err)) return;
      setAccionError(err instanceof Error ? err.message : 'No se pudo cargar la parcela');
    } finally {
      if (!controller.signal.aborted) setCargandoDetalle(false);
    }
  };

  const confirmarEliminar = async () => {
    const parcela = pendingDelete;
    if (!parcela || deletingId !== null) return;
    try {
      setAccionError('');
      setDeletingId(parcela.id);
      await parcelaService.eliminar(parcela.id);
      setParcelas((prev) => prev.filter((item) => item.id !== parcela.id));
      // Si era el último elemento de la última página, se retrocede una página.
      const paginasRestantes = Math.max(1, Math.ceil((pagina.totalItems - 1) / pageSize));
      setPage((prev) => Math.min(prev, paginasRestantes));
      mostrarExito(`Parcela ${parcela.codigo} eliminada.`);
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="GESTIÓN DE PARCELAS"
        titulo="Parcelas"
        descripcion={puedeEditar ? 'Parcelas asociadas a cada predio mediante predioId.' : 'Parcelas de cada predio (solo lectura para su rol).'}
        accion={puedeEditar ? <Button onClick={abrirNueva}>+ Nueva parcela</Button> : undefined}
      />

      <Modal
        open={mostrarFormulario}
        title={editando ? `Editar parcela ${editando.codigo}` : 'Nueva parcela'}
        onClose={cerrarFormulario}
      >
        <ParcelaForm
          key={editando?.id ?? 'nueva'}
          predios={predios}
          parcela={editando}
          onCancel={cerrarFormulario}
          onSaved={(guardada) => {
            setParcelas((prev) =>
              editando ? prev.map((item) => (item.id === guardada.id ? guardada : item)) : [...prev, guardada],
            );
            mostrarExito(editando ? 'Parcela actualizada correctamente.' : 'Parcela creada correctamente.');
            cerrarFormulario();
          }}
        />
      </Modal>

      {bitacoraDe && (
        <BitacoraParcelaPanel
          key={bitacoraDe.id}
          parcela={bitacoraDe}
          nombrePredio={prediosPorId.get(bitacoraDe.predioId)?.nombre ?? `Predio #${bitacoraDe.predioId}`}
          onCerrar={() => setBitacoraDe(null)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar parcela"
        message={pendingDelete ? `¿Eliminar la parcela ${pendingDelete.codigo}? Esta acción no se puede deshacer.` : ''}
        loading={deletingId !== null}
        onConfirm={confirmarEliminar}
        onCancel={() => setPendingDelete(null)}
      />

      {cargandoDetalle && <div className="state-card">Cargando detalle...</div>}
      {successMessage && <div className="form-success" role="status">{successMessage}</div>}
      {accionError && <div className="form-error">{accionError}</div>}
      {loading && <div className="state-card">Cargando parcelas...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Total', valor: total },
              { etiqueta: 'Disponibles', valor: disponibles },
              { etiqueta: 'Área total', valor: formatArea(areaTotal) },
            ]}
          />
          <div className="filter-bar">
            <SearchInput
              label="Buscar parcela"
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Código o nombre del predio"
            />
            <SelectFilter label="Predio" value={predioFiltro} onChange={cambiarPredioFiltro} options={opcionesPredio} />
            <SelectFilter label="Estado" value={estadoFiltro} onChange={cambiarEstadoFiltro} options={OPCIONES_ESTADO} />
            <ExportarBotones
              titulo="Parcelas"
              filas={parcelasFiltradas}
              columnas={[
                { titulo: 'Código', valor: (p) => p.codigo },
                { titulo: 'Predio', valor: (p) => prediosPorId.get(p.predioId)?.nombre },
                { titulo: 'Hectáreas', valor: (p) => p.areaHa },
                { titulo: 'Estado', valor: (p) => p.estado.replace(/_/g, ' ') },
              ]}
            />
          </div>
          {total === 0 ? (
            <EmptyState title="No hay parcelas registradas." description={puedeEditar ? 'Crea la primera con «+ Nueva parcela».' : 'El administrador aún no registró parcelas.'} />
          ) : pagina.totalItems === 0 ? (
            <EmptyState title="Sin resultados." description="Ninguna parcela coincide con la búsqueda o los filtros." />
          ) : (
            <>
              <ParcelaTable
                parcelas={pagina.items}
                prediosPorId={prediosPorId}
                onEditar={puedeEditar ? editar : undefined}
                onEliminar={puedeEditar ? setPendingDelete : undefined}
                onBitacora={puedeVerBitacora ? setBitacoraDe : undefined}
                onFicha={(parcela) => navigate(`/parcelas/${parcela.id}`)}
                deletingId={deletingId}
              />
              <Pagination
                page={pagina.page}
                totalPages={pagina.totalPages}
                totalItems={pagina.totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={cambiarPageSize}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
