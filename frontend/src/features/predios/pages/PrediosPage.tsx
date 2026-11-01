import { useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../../auth/context/useAuth';
import PredioForm from '../components/PredioForm';
import PredioTable from '../components/PredioTable';
import { usePredios } from '../hooks/usePredios';
import type { Predio } from '../models/Predio';
import { predioService } from '../services/predioService';
import { filtrarPredios, type FiltroEstadoPredio } from '../utils/filtrarPredios';

const OPCIONES_ESTADO = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
];

export default function PrediosPage() {
  const { predios, setPredios, loading, error } = usePredios();
  const puedeEditar = useAuth().puede('predios.editar');
  const { successMessage, mostrarExito } = useMensajeExito();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Predio | null>(null);
  const [accionError, setAccionError] = useState('');
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Predio | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstadoPredio>('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const detalleRef = useRef<AbortController | null>(null);

  // Si la página se desmonta con un GET de detalle en vuelo, se cancela.
  useEffect(() => () => detalleRef.current?.abort(), []);

  // Todo derivado en el render: primero se filtra y después se pagina.
  const prediosFiltrados = filtrarPredios(predios, busqueda, estadoFiltro);
  const pagina = paginar(prediosFiltrados, page, pageSize);

  const total = predios.length;
  const activos = predios.filter((predio) => predio.activo).length;

  // Cualquier cambio de búsqueda, filtro o tamaño vuelve a la página 1.
  const cambiarBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPage(1);
  };
  const cambiarEstadoFiltro = (valor: string) => {
    setEstadoFiltro(valor as FiltroEstadoPredio);
    setPage(1);
  };
  const cambiarPageSize = (valor: number) => {
    setPageSize(valor);
    setPage(1);
  };

  const abrirNuevo = () => {
    setEditando(null);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(null);
  };

  // Editar parte de los datos frescos del backend (GET /predios/{id}); si ya no existe, no se abre el formulario.
  const editar = async (predio: Predio) => {
    detalleRef.current?.abort();
    const controller = new AbortController();
    detalleRef.current = controller;
    try {
      setAccionError('');
      setCargandoDetalle(true);
      const detalle = await predioService.obtenerPorId(predio.id, controller.signal);
      setEditando(detalle);
      setMostrarFormulario(true);
    } catch (err) {
      if (isAbortError(err)) return;
      setAccionError(err instanceof Error ? err.message : 'No se pudo cargar el predio');
    } finally {
      if (!controller.signal.aborted) setCargandoDetalle(false);
    }
  };

  const confirmarEliminar = async () => {
    const predio = pendingDelete;
    if (!predio || deletingId !== null) return;
    try {
      setAccionError('');
      setDeletingId(predio.id);
      await predioService.eliminar(predio.id);
      setPredios((prev) => prev.filter((item) => item.id !== predio.id));
      // Si era el último elemento de la última página, se retrocede una página.
      const paginasRestantes = Math.max(1, Math.ceil((pagina.totalItems - 1) / pageSize));
      setPage((prev) => Math.min(prev, paginasRestantes));
      mostrarExito(`Predio "${predio.nombre}" eliminado.`);
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
        eyebrow="GESTIÓN DE PREDIOS"
        titulo="Predios"
        descripcion={puedeEditar ? 'Fundos y terrenos registrados en la API REST de AgroControl.' : 'Fundos y terrenos registrados (solo lectura para su rol).'}
        accion={puedeEditar ? <Button onClick={abrirNuevo}>+ Nuevo predio</Button> : undefined}
      />

      <Modal
        open={mostrarFormulario}
        title={editando ? `Editar predio #${editando.id}` : 'Nuevo predio'}
        onClose={cerrarFormulario}
      >
        <PredioForm
          key={editando?.id ?? 'nuevo'}
          predio={editando}
          onCancel={cerrarFormulario}
          onSaved={(guardado) => {
            setPredios((prev) =>
              editando ? prev.map((item) => (item.id === guardado.id ? guardado : item)) : [...prev, guardado],
            );
            mostrarExito(editando ? 'Predio actualizado correctamente.' : 'Predio creado correctamente.');
            cerrarFormulario();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar predio"
        message={pendingDelete ? `¿Eliminar el predio "${pendingDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
        loading={deletingId !== null}
        onConfirm={confirmarEliminar}
        onCancel={() => setPendingDelete(null)}
      />

      {cargandoDetalle && <div className="state-card">Cargando detalle...</div>}
      {successMessage && <div className="form-success" role="status">{successMessage}</div>}
      {accionError && <div className="form-error">{accionError}</div>}
      {loading && <div className="state-card">Cargando predios...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Total', valor: total },
              { etiqueta: 'Activos', valor: activos },
              { etiqueta: 'Inactivos', valor: total - activos },
            ]}
          />
          <div className="filter-bar">
            <SearchInput
              label="Buscar predio"
              value={busqueda}
              onChange={cambiarBusqueda}
              placeholder="Nombre o ubicación"
            />
            <SelectFilter label="Estado" value={estadoFiltro} onChange={cambiarEstadoFiltro} options={OPCIONES_ESTADO} />
            <ExportarBotones
              titulo="Predios"
              filas={prediosFiltrados}
              columnas={[
                { titulo: 'Predio', valor: (p) => p.nombre },
                { titulo: 'Ubicación', valor: (p) => p.ubicacion },
                { titulo: 'Hectáreas', valor: (p) => p.areaHa },
                { titulo: 'Activo', valor: (p) => (p.activo ? 'Sí' : 'No') },
              ]}
            />
          </div>
          {total === 0 ? (
            <EmptyState title="No hay predios registrados." description={puedeEditar ? 'Crea el primero con «+ Nuevo predio».' : 'El administrador aún no registró predios.'} />
          ) : pagina.totalItems === 0 ? (
            <EmptyState title="Sin resultados." description="Ningún predio coincide con la búsqueda o el filtro." />
          ) : (
            <>
              <PredioTable
                predios={pagina.items}
                onEditar={puedeEditar ? editar : undefined}
                onEliminar={puedeEditar ? setPendingDelete : undefined}
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
