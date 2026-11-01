import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import MotivoDialog from '../../../components/ui/MotivoDialog';
import { useCarga } from '../../../hooks/useCarga';
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
import IncidenciaForm from '../components/IncidenciaForm';
import ResolverPanel from '../components/ResolverPanel';
import { nombreTipoIncidencia, type Incidencia } from '../models/Incidencia';
import { incidenciaService } from '../services/incidenciaService';
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
          {incidencias.length === 0 ? (
            <EmptyState title="No hay incidencias registradas." />
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Tipo</th><th>Gravedad</th><th>Parcela</th><th>Cultivo</th><th>Labor</th><th>Descripción</th><th>Reportado por</th><th>Estado</th>{puedeGestionar && <th>Acciones</th>}</tr>
                  </thead>
                  <tbody>
                    {incidencias.map((incidencia) => (
                      <tr key={incidencia.id} title={incidencia.motivoAnulacion ?? undefined}>
                        <td>{formatFecha(incidencia.fecha)}</td>
                        <td>{nombreTipoIncidencia(incidencia.tipo)}</td>
                        <td><StatusBadge estado={incidencia.gravedad} /></td>
                        <td>{incidencia.parcelaId ? etiquetaParcela(incidencia.parcelaId, catalogos) : '—'}</td>
                        <td>{cultivoDeCampana(incidencia.campanaId)}</td>
                        <td>{tipoLabor(incidencia.laborId)}</td>
                        <td>{incidencia.descripcion}</td>
                        <td>{nombreUsuario(usuarios, incidencia.usuarioId)}</td>
                        <td>
                          <StatusBadge estado={incidencia.estado} />
                          {incidencia.resolucion && <small className="muted celda-nota">{incidencia.resolucion}</small>}
                        </td>
                        {puedeGestionar && (
                          <td>
                            <div className="table-actions">
                              {incidencia.estado === 'ABIERTA' && (
                                <Button variant="secondary" size="sm" type="button" onClick={() => atender(incidencia)}>Atender</Button>
                              )}
                              {incidenciaAbierta(incidencia) ? (
                                <>
                                  <Button variant="secondary" size="sm" type="button" onClick={() => setResolviendo(incidencia)}>Resolver</Button>
                                  <Button variant="secondary" size="sm" type="button" onClick={() => setAnulando(incidencia)}>Anular</Button>
                                </>
                              ) : (
                                <span className="muted">—</span>
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
