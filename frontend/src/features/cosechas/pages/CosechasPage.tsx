import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import MotivoDialog from '../../../components/ui/MotivoDialog';
import { useCarga } from '../../../hooks/useCarga';
import { sinAnulados } from '../../../shared/utils/estados';
import { formatCantidad, formatFecha } from '../../../utils/formato';
import type { Campana } from '../../campanas/models/Campana';
import { campanaService } from '../../campanas/services/campanaService';
import { etiquetaCampana } from '../../campanas/utils/etiquetas';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { parcelaService } from '../../parcelas/services/parcelaService';
import { predioService } from '../../predios/services/predioService';
import type { Usuario } from '../../usuarios/models/Usuario';
import { nombreUsuario, usuarioService } from '../../usuarios/services/usuarioService';
import { useAuth } from '../../auth/context/useAuth';
import CosechaForm from '../components/CosechaForm';
import type { Cosecha } from '../models/Cosecha';
import { cosechaService } from '../services/cosechaService';

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

export default function CosechasPage() {
  const { datos, setDatos, loading, error } = useCarga(cargarDatos, {
    cosechas: [] as Cosecha[],
    campanas: [] as Campana[],
    usuarios: [] as Usuario[],
    catalogos: { predios: [], parcelas: [], cultivos: [] },
  });
  const { cosechas, campanas, usuarios, catalogos } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeRegistrar = useAuth().puede('cosechas.registrar');
  const [anulando, setAnulando] = useState<Cosecha | null>(null);

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
  const vigentes = sinAnulados(cosechas);
  const toneladas = vigentes.reduce((suma, c) => suma + c.toneladas, 0);
  const campanasCosechadas = new Set(vigentes.map((cosecha) => cosecha.campanaId)).size;

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="RESULTADOS"
        titulo="Cosechas"
        descripcion="Producción obtenida por campaña y quién la registró."
        accion={
          puedeRegistrar ? (
            <button type="button" className="btn-primary" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Registrar cosecha'}
            </button>
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

      {loading && <div className="state-card">Cargando cosechas...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Registros', valor: vigentes.length },
              { etiqueta: 'Campañas cosechadas', valor: campanasCosechadas },
              { etiqueta: 'Total en toneladas', valor: formatCantidad(toneladas, 't') },
            ]}
          />
          {cosechas.length === 0 ? (
            <div className="empty-state">No hay cosechas registradas.</div>
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Campaña</th><th>Cantidad</th><th>Registrado por</th>{puedeRegistrar && <th>Acciones</th>}</tr>
                  </thead>
                  <tbody>
                    {cosechas.map((cosecha) => {
                      const campanaCosecha = campana(cosecha.campanaId);
                      return (
                        <tr key={cosecha.id} className={cosecha.anulado ? 'fila-anulada' : undefined} title={cosecha.motivoAnulacion ?? undefined}>
                          <td>{formatFecha(cosecha.fecha)}</td>
                          <td>{campanaCosecha ? etiquetaCampana(campanaCosecha, catalogos) : `Campaña ${cosecha.campanaId}`}</td>
                          <td className="code-cell">{formatCantidad(cosecha.cantidad, cosecha.unidadMedida)}</td>
                          <td>{nombreUsuario(usuarios, cosecha.usuarioId)}</td>
                          {puedeRegistrar && (
                            <td>
                              {!cosecha.anulado && (
                                <button type="button" className="btn-link" onClick={() => setAnulando(cosecha)}>Anular</button>
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
