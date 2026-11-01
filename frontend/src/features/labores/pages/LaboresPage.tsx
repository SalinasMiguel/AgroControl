import { useMemo, useState } from 'react';
import FechaAccionPanel from '../../../components/common/FechaAccionPanel';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import { useCarga } from '../../../hooks/useCarga';
import { useAuth } from '../../auth/context/useAuth';
import type { Campana } from '../../campanas/models/Campana';
import { campanaService } from '../../campanas/services/campanaService';
import { etiquetaCampana } from '../../campanas/utils/etiquetas';
import { cultivoService } from '../../cultivos/services/cultivoService';
import type { Insumo } from '../../insumos/models/Insumo';
import { insumoService } from '../../insumos/services/insumoService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import type { RolCatalogo } from '../../usuarios/models/Rol';
import type { Usuario } from '../../usuarios/models/Usuario';
import { rolService } from '../../usuarios/services/rolService';
import { usuarioService } from '../../usuarios/services/usuarioService';
import AsignarPanel from '../components/AsignarPanel';
import BitacoraLaborPanel from '../../bitacora/components/BitacoraLaborPanel';
import ConsumosPanel from '../components/ConsumosPanel';
import LaborForm from '../components/LaborForm';
import LaborTable from '../components/LaborTable';
import type { AsignacionLabor, Labor } from '../models/Labor';
import { laborService } from '../services/laborService';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

// Para el operario el backend ya devuelve solo sus labores asignadas (RN-05);
// las asignaciones y los roles solo se piden si el rol planifica.
const cargarDatos = (planifica: boolean) => async (signal: AbortSignal) => {
  const [labores, campanas, predios, parcelas, cultivos, insumos, usuarios, roles, asignaciones] = await Promise.all([
    laborService.listar(signal),
    campanaService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
    insumoService.listar(signal),
    planifica ? usuarioService.listar(signal) : Promise.resolve<Usuario[]>([]),
    planifica ? rolService.listar(signal) : Promise.resolve<RolCatalogo[]>([]),
    planifica ? laborService.listarAsignaciones(signal) : Promise.resolve<AsignacionLabor[]>([]),
  ]);
  return { labores, campanas, insumos, usuarios, roles, asignaciones, catalogos: { predios, parcelas, cultivos } };
};

export default function LaboresPage() {
  const { sesion, puede } = useAuth();
  const esOperario = sesion?.rol === 'OPERARIO';
  const puedePlanificar = puede('labores.planificar');
  const puedeEjecutar = puede('labores.ejecutar');
  const puedeAnotar = puede('bitacora.registrar');

  const { datos, setDatos, loading, error, recargar } = useCarga(cargarDatos(puedePlanificar), {
    labores: [] as Labor[],
    campanas: [] as Campana[],
    insumos: [] as Insumo[],
    usuarios: [] as Usuario[],
    roles: [] as RolCatalogo[],
    asignaciones: [] as AsignacionLabor[],
    catalogos: { predios: [], parcelas: [], cultivos: [] },
  });
  const { labores, campanas, insumos, usuarios, roles, asignaciones, catalogos } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroCampana, setFiltroCampana] = useState('');
  const [ejecutando, setEjecutando] = useState<Labor | null>(null);
  const [conInsumos, setConInsumos] = useState<Labor | null>(null);
  const [asignando, setAsignando] = useState<Labor | null>(null);
  const [conBitacora, setConBitacora] = useState<Labor | null>(null);

  const rolOperarioId = roles.find((rol) => rol.nombre === 'OPERARIO')?.id;
  const asignadosPorLabor = useMemo(() => {
    const nombres = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombreCompleto]));
    const mapa = new Map<number, string[]>();
    asignaciones.forEach((asignacion) => {
      const lista = mapa.get(asignacion.laborId) ?? [];
      lista.push(nombres.get(asignacion.usuarioId) ?? `Usuario ${asignacion.usuarioId}`);
      mapa.set(asignacion.laborId, lista);
    });
    return mapa;
  }, [usuarios, asignaciones]);

  const operariosDisponibles = (labor: Labor) =>
    usuarios.filter(
      (usuario) =>
        usuario.rolId === rolOperarioId &&
        usuario.estado === 'ACTIVO' &&
        !asignaciones.some((a) => a.laborId === labor.id && a.usuarioId === usuario.id),
    );

  const visibles = filtroCampana ? labores.filter((labor) => labor.campanaId === Number(filtroCampana)) : labores;
  const pendientes = visibles.filter((labor) => labor.estado !== 'EJECUTADA').length;
  const [accionError, setAccionError] = useState('');

  const iniciar = async (labor: Labor) => {
    setAccionError('');
    try {
      const actualizada = await laborService.iniciar(labor.id);
      setDatos((prev) => ({
        ...prev,
        labores: prev.labores.map((item) => (item.id === actualizada.id ? actualizada : item)),
      }));
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo iniciar la labor');
    }
  };

  const abrirPanel = (panel: 'ejecutar' | 'insumos' | 'asignar' | 'bitacora', labor: Labor) => {
    setEjecutando(panel === 'ejecutar' ? labor : null);
    setConInsumos(panel === 'insumos' ? labor : null);
    setAsignando(panel === 'asignar' ? labor : null);
    setConBitacora(panel === 'bitacora' ? labor : null);
  };

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow={esOperario ? 'MI AGENDA DE CAMPO' : 'TRABAJO DE CAMPO'}
        titulo={esOperario ? 'Mis labores' : 'Labores'}
        descripcion={
          esOperario
            ? 'Labores que el jefe de campo le asignó: márquelas como ejecutadas y registre los insumos que usó.'
            : puedePlanificar
              ? 'Planifique labores por campaña, asigne operarios y controle los insumos consumidos.'
              : puedeAnotar
                ? 'Tareas planificadas y ejecutadas en cada campaña. Puede dejar observaciones en la bitácora de cada labor.'
                : 'Tareas planificadas y ejecutadas en cada campaña (solo lectura para su rol).'
        }
        accion={
          puedePlanificar ? (
            <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Nueva labor'}
            </Button>
          ) : undefined
        }
      />

      {puedePlanificar && mostrarFormulario && (
        <LaborForm
          campanas={campanas}
          catalogos={catalogos}
          onCreated={(nueva) => setDatos((prev) => ({ ...prev, labores: [nueva, ...prev.labores] }))}
        />
      )}

      {asignando && (
        <AsignarPanel
          key={asignando.id}
          labor={asignando}
          disponibles={operariosDisponibles(asignando)}
          onAsignado={(nueva) => setDatos((prev) => ({ ...prev, asignaciones: [...prev.asignaciones, nueva] }))}
          onCerrar={() => setAsignando(null)}
        />
      )}

      {ejecutando && (
        <FechaAccionPanel
          key={ejecutando.id}
          titulo={`Ejecutar ${ejecutando.tipo.replace(/_/g, ' ').toLowerCase()} (labor #${ejecutando.id})`}
          etiqueta="Fecha de ejecución"
          textoBoton="Marcar como ejecutada"
          onCancelar={() => setEjecutando(null)}
          onConfirmar={async (fecha) => {
            const actualizada = await laborService.ejecutar(ejecutando.id, fecha);
            setDatos((prev) => ({
              ...prev,
              labores: prev.labores.map((item) => (item.id === actualizada.id ? actualizada : item)),
            }));
            setEjecutando(null);
          }}
        />
      )}

      {conInsumos && (
        <ConsumosPanel
          labor={conInsumos}
          insumos={insumos}
          puedeRegistrar={puedeEjecutar}
          onConsumoRegistrado={recargar}
          onCerrar={() => setConInsumos(null)}
        />
      )}

      {conBitacora && (
        <BitacoraLaborPanel
          key={conBitacora.id}
          labor={conBitacora}
          puedeRegistrar={puedeAnotar}
          onCerrar={() => setConBitacora(null)}
        />
      )}

      {accionError && <div className="form-error">{accionError}</div>}

      {loading && <div className="state-card">Cargando labores...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: esOperario ? 'Asignadas a mí' : 'Labores', valor: visibles.length },
              { etiqueta: 'Pendientes', valor: pendientes },
              { etiqueta: 'En curso', valor: visibles.filter((labor) => labor.estado === 'EN_CURSO').length },
              { etiqueta: 'Ejecutadas', valor: visibles.length - pendientes },
            ]}
          />
          <div className="toolbar">
            <label htmlFor="filtro-campana" className="muted">Campaña:</label>
            <select id="filtro-campana" value={filtroCampana} onChange={(e) => setFiltroCampana(e.target.value)}>
              <option value="">Todas</option>
              {campanas.map((campana) => (
                <option key={campana.id} value={campana.id}>{etiquetaCampana(campana, catalogos)}</option>
              ))}
            </select>
          </div>
          {esOperario && labores.length === 0 ? (
            <EmptyState title="Todavía no tiene labores asignadas." />
          ) : (
            <LaborTable
              labores={visibles}
              campanas={campanas}
              catalogos={catalogos}
              asignados={puedePlanificar ? asignadosPorLabor : undefined}
              onAsignar={puedePlanificar ? (labor) => abrirPanel('asignar', labor) : undefined}
              onIniciar={puedeEjecutar ? iniciar : undefined}
              onEjecutar={puedeEjecutar ? (labor) => abrirPanel('ejecutar', labor) : undefined}
              onInsumos={(labor) => abrirPanel('insumos', labor)}
              onBitacora={(labor) => abrirPanel('bitacora', labor)}
            />
          )}
        </>
      )}
    </section>
  );
}
