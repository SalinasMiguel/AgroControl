import { useState } from 'react';
import FechaAccionPanel from '../../../components/common/FechaAccionPanel';
import { useNavigate } from 'react-router';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import EmptyState from '../../../components/ui/EmptyState';
import MotivoDialog from '../../../components/ui/MotivoDialog';
import { formatFecha } from '../../../utils/formato';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import SearchInput from '../../../components/ui/SearchInput';
import SelectFilter from '../../../components/ui/SelectFilter';
import { useCarga } from '../../../hooks/useCarga';
import { formatArea } from '../../../utils/area';
import { cosechaService } from '../../cosechas/services/cosechaService';
import type { Cosecha } from '../../cosechas/models/Cosecha';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import { useAuth } from '../../auth/context/useAuth';
import CampanaForm from '../components/CampanaForm';
import AvancePanel from '../components/AvancePanel';
import CampanaTable from '../components/CampanaTable';
import type { Campana, EstadoCampana } from '../models/Campana';
import { campanaService } from '../services/campanaService';
import { etiquetaCampana, etiquetaParcela, nombreCultivo } from '../utils/etiquetas';
import { filtrarCampanas } from '../utils/filtrarCampanas';
import { rendimientos, superficie } from '../utils/rendimiento';
import Button from '../../../components/ui/Button';

const cargarDatos = async (signal: AbortSignal) => {
  const [campanas, predios, parcelas, cultivos, cosechas] = await Promise.all([
    campanaService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    cosechaService.listar(signal),
  ]);
  return { campanas, catalogos: { predios, parcelas, cultivos }, cosechas };
};

type Accion = 'cancelar' | 'perder' | 'reabrir';

const OPCIONES_ESTADO = [
  { value: '', label: 'Todos los estados' },
  { value: 'PLANIFICADA', label: 'Planificadas' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'FINALIZADA', label: 'Finalizadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
  { value: 'PERDIDA', label: 'Perdidas' },
];

const AVISO_INSUMOS = 'Los insumos ya registrados no vuelven al almacén; anúlelos por separado';

const DIALOGO: Record<Accion, { titulo: string; boton: string; aviso?: string; conFecha?: string }> = {
  cancelar: { titulo: 'Cancelar campaña', boton: 'Cancelar campaña', aviso: 'Sus labores pendientes también se cancelan.' },
  perder: { titulo: 'Marcar campaña perdida', boton: 'Marcar perdida', aviso: AVISO_INSUMOS, conFecha: 'Fecha de fin' },
  reabrir: { titulo: 'Reabrir campaña', boton: 'Reabrir', aviso: 'Las labores canceladas no vuelven: se planifican de nuevo.' },
};

export default function CampanasPage() {
  const navigate = useNavigate();
  const { datos, setDatos, loading, error, recargar } = useCarga(cargarDatos, {
    campanas: [] as Campana[],
    catalogos: { predios: [], parcelas: [], cultivos: [] },
    cosechas: [] as Cosecha[],
  });
  const { campanas, catalogos, cosechas } = datos;
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoCampana | ''>('');
  const [cultivoFiltro, setCultivoFiltro] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeGestionar = useAuth().puede('campanas.gestionar');
  const [finalizando, setFinalizando] = useState<Campana | null>(null);
  const [editando, setEditando] = useState<Campana | null>(null);
  const [dialogo, setDialogo] = useState<{ accion: Accion; campana: Campana } | null>(null);
  const [conAvance, setConAvance] = useState<Campana | null>(null);
  const [accionError, setAccionError] = useState('');

  const reemplazar = (actualizada: Campana) =>
    setDatos((prev) => ({
      ...prev,
      campanas: prev.campanas.map((item) => (item.id === actualizada.id ? actualizada : item)),
    }));

  const iniciar = async (campana: Campana) => {
    try {
      setAccionError('');
      reemplazar(await campanaService.iniciar(campana.id));
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo iniciar');
    }
  };

  // Cancelar, perder o reabrir también cambian las labores: se recarga todo.
  const confirmarDialogo = async (motivo: string, fecha: string) => {
    if (!dialogo) return;
    const { accion, campana } = dialogo;
    if (accion === 'cancelar') await campanaService.cancelar(campana.id, motivo);
    if (accion === 'perder') await campanaService.marcarPerdida(campana.id, motivo, fecha);
    if (accion === 'reabrir') await campanaService.reabrir(campana.id, motivo);
    setDialogo(null);
    recargar();
  };

  const contar = (estado: Campana['estado']) => campanas.filter((campana) => campana.estado === estado).length;

  const visibles = filtrarCampanas(campanas, catalogos, { busqueda, estado: estadoFiltro, cultivoId: cultivoFiltro });
  const opcionesCultivo = [
    { value: '', label: 'Todos los cultivos' },
    ...catalogos.cultivos.map((cultivo) => ({ value: String(cultivo.id), label: cultivo.nombre })),
  ];
  const porCampana = rendimientos(campanas, cosechas, catalogos.parcelas, catalogos.cultivos);
  const hectareasEnCurso = campanas
    .filter((campana) => campana.estado === 'EN_CURSO')
    .reduce((suma, campana) => suma + (superficie(campana, catalogos.parcelas) ?? 0), 0);

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="PLANIFICACIÓN"
        titulo="Campañas"
        descripcion="Ciclos de cultivo por parcela: se planifican, se inician y se finalizan."
        accion={
          puedeGestionar ? (
            <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Nueva campaña'}
            </Button>
          ) : undefined
        }
      />

      {puedeGestionar && mostrarFormulario && (
        <CampanaForm
          catalogos={catalogos}
          campanas={campanas}
          onGuardado={(nueva) => setDatos((prev) => ({ ...prev, campanas: [nueva, ...prev.campanas] }))}
        />
      )}

      {editando && (
        <CampanaForm
          key={editando.id}
          catalogos={catalogos}
          campanas={campanas}
          campana={editando}
          onGuardado={(actualizada) => {
            reemplazar(actualizada);
            setEditando(null);
          }}
          onCerrar={() => setEditando(null)}
        />
      )}

      {finalizando && (
        <FechaAccionPanel
          key={finalizando.id}
          titulo={`Finalizar campaña: ${etiquetaCampana(finalizando, catalogos)}`}
          etiqueta="Fecha de fin"
          textoBoton="Finalizar campaña"
          onCancelar={() => setFinalizando(null)}
          onConfirmar={async (fecha) => {
            reemplazar(await campanaService.finalizar(finalizando.id, fecha));
            setFinalizando(null);
          }}
        />
      )}

      {accionError && <div className="form-error">{accionError}</div>}
      {loading && <div className="state-card">Cargando campañas...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Planificadas', valor: contar('PLANIFICADA') },
              { etiqueta: 'En curso', valor: contar('EN_CURSO') },
              { etiqueta: 'Finalizadas', valor: contar('FINALIZADA') },
              { etiqueta: 'Hectáreas en curso', valor: formatArea(hectareasEnCurso) },
            ]}
          />
          <div className="filter-bar">
            <SearchInput label="Buscar campaña" value={busqueda} onChange={setBusqueda} placeholder="Parcela, cultivo o variedad" />
            <SelectFilter label="Estado" value={estadoFiltro} onChange={(valor) => setEstadoFiltro(valor as EstadoCampana | '')} options={OPCIONES_ESTADO} />
            <SelectFilter label="Cultivo" value={cultivoFiltro} onChange={setCultivoFiltro} options={opcionesCultivo} />
            <ExportarBotones
              titulo="Campañas"
              filas={visibles}
              columnas={[
                { titulo: 'Cultivo', valor: (c) => nombreCultivo(c.cultivoId, catalogos) },
                { titulo: 'Variedad', valor: (c) => c.variedad },
                { titulo: 'Parcela', valor: (c) => etiquetaParcela(c.parcelaId, catalogos) },
                { titulo: 'Hectáreas', valor: (c) => superficie(c, catalogos.parcelas) },
                { titulo: 'Inicio', valor: (c) => formatFecha(c.fechaInicio) },
                { titulo: 'Cosecha', valor: (c) => formatFecha(c.fechaFin ?? c.fechaCosechaEstimada) },
                { titulo: 'Rendimiento t/ha', valor: (c) => porCampana[c.id]?.toFixed(2) ?? null },
                { titulo: 'Estado', valor: (c) => c.estado },
              ]}
            />
          </div>
          {conAvance && (
            <AvancePanel
              key={conAvance.id}
              campana={conAvance}
              titulo={`${nombreCultivo(conAvance.cultivoId, catalogos)} en ${etiquetaParcela(conAvance.parcelaId, catalogos)}`}
              onCerrar={() => setConAvance(null)}
            />
          )}
          {campanas.length > 0 && visibles.length === 0 ? (
            <EmptyState title="Sin resultados." description="Ninguna campaña coincide con la búsqueda o los filtros." />
          ) : (
          <CampanaTable
            campanas={visibles}
            catalogos={catalogos}
            rendimientos={porCampana}
            onAvance={setConAvance}
            onFicha={(campana) => navigate(`/campanas/${campana.id}`)}
            onEditar={puedeGestionar ? setEditando : undefined}
            onIniciar={puedeGestionar ? iniciar : undefined}
            onCancelar={puedeGestionar ? (campana) => setDialogo({ accion: 'cancelar', campana }) : undefined}
            onMarcarPerdida={puedeGestionar ? (campana) => setDialogo({ accion: 'perder', campana }) : undefined}
            onReabrir={puedeGestionar ? (campana) => setDialogo({ accion: 'reabrir', campana }) : undefined}
            onFinalizar={
              puedeGestionar
                ? (campana) => {
                    setAccionError('');
                    setFinalizando(campana);
                  }
                : undefined
            }
          />
          )}
        </>
      )}

      <MotivoDialog
        key={dialogo?.accion ?? 'cerrado'}
        open={dialogo !== null}
        title={dialogo ? DIALOGO[dialogo.accion].titulo : ''}
        confirmLabel={dialogo ? DIALOGO[dialogo.accion].boton : ''}
        aviso={dialogo ? DIALOGO[dialogo.accion].aviso : undefined}
        conFecha={dialogo ? DIALOGO[dialogo.accion].conFecha : undefined}
        onConfirm={confirmarDialogo}
        onCancel={() => setDialogo(null)}
      />
    </section>
  );
}
