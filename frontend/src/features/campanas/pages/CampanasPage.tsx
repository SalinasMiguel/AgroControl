import { useState } from 'react';
import FechaAccionPanel from '../../../components/common/FechaAccionPanel';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import { useCarga } from '../../../hooks/useCarga';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import { useAuth } from '../../auth/context/useAuth';
import CampanaForm from '../components/CampanaForm';
import AvancePanel from '../components/AvancePanel';
import CampanaTable from '../components/CampanaTable';
import type { Campana } from '../models/Campana';
import { campanaService } from '../services/campanaService';
import { etiquetaCampana, etiquetaParcela, nombreCultivo } from '../utils/etiquetas';
import Button from '../../../components/ui/Button';

const cargarDatos = async (signal: AbortSignal) => {
  const [campanas, predios, parcelas, cultivos] = await Promise.all([
    campanaService.listar(signal),
    predioService.listar(signal),
    parcelaService.listar(signal),
    cultivoService.listar(signal),
  ]);
  return { campanas, catalogos: { predios, parcelas, cultivos } };
};

export default function CampanasPage() {
  const { datos, setDatos, loading, error } = useCarga(cargarDatos, {
    campanas: [] as Campana[],
    catalogos: { predios: [], parcelas: [], cultivos: [] },
  });
  const { campanas, catalogos } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeGestionar = useAuth().puede('campanas.gestionar');
  const [finalizando, setFinalizando] = useState<Campana | null>(null);
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

  const contar = (estado: Campana['estado']) => campanas.filter((campana) => campana.estado === estado).length;

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
          onCreated={(nueva) => setDatos((prev) => ({ ...prev, campanas: [nueva, ...prev.campanas] }))}
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
            ]}
          />
          {conAvance && (
            <AvancePanel
              key={conAvance.id}
              campana={conAvance}
              titulo={`${nombreCultivo(conAvance.cultivoId, catalogos)} en ${etiquetaParcela(conAvance.parcelaId, catalogos)}`}
              onCerrar={() => setConAvance(null)}
            />
          )}
          <CampanaTable
            campanas={campanas}
            catalogos={catalogos}
            onAvance={setConAvance}
            onIniciar={puedeGestionar ? iniciar : undefined}
            onFinalizar={
              puedeGestionar
                ? (campana) => {
                    setAccionError('');
                    setFinalizando(campana);
                  }
                : undefined
            }
          />
        </>
      )}
    </section>
  );
}
