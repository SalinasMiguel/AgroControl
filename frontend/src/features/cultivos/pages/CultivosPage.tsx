import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import { useCarga } from '../../../hooks/useCarga';
import { formatArea } from '../../../utils/area';
import { campanaService } from '../../campanas/services/campanaService';
import type { Campana } from '../../campanas/models/Campana';
import { cosechaService } from '../../cosechas/services/cosechaService';
import type { Cosecha } from '../../cosechas/models/Cosecha';
import { parcelaService } from '../../parcelas/services/parcelaService';
import type { Parcela } from '../../parcelas/models/Parcela';
import { useAuth } from '../../auth/context/useAuth';
import CultivoForm from '../components/CultivoForm';
import type { Cultivo } from '../models/Cultivo';
import { cultivoService } from '../services/cultivoService';
import { resumenPorCultivo } from '../utils/resumenCultivos';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

const cargarDatos = async (signal: AbortSignal) => {
  const [cultivos, campanas, cosechas, parcelas] = await Promise.all([
    cultivoService.listar(signal),
    campanaService.listar(signal),
    cosechaService.listar(signal),
    parcelaService.listar(signal),
  ]);
  return { cultivos, campanas, cosechas, parcelas };
};

const tPorHa = (valor: number | null | undefined) => (valor ? `${valor.toFixed(2).replace('.', ',')} t/ha` : '—');

export default function CultivosPage() {
  const { datos, setDatos, loading, error } = useCarga(cargarDatos, {
    cultivos: [] as Cultivo[],
    campanas: [] as Campana[],
    cosechas: [] as Cosecha[],
    parcelas: [] as Parcela[],
  });
  const { cultivos, campanas, cosechas, parcelas } = datos;
  const setCultivos = (cambiar: (prev: Cultivo[]) => Cultivo[]) =>
    setDatos((prev) => ({ ...prev, cultivos: cambiar(prev.cultivos) }));
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeCrear = useAuth().puede('cultivos.crear');
  const [editando, setEditando] = useState<Cultivo | null>(null);
  const resumen = resumenPorCultivo(cultivos, campanas, cosechas, parcelas);
  const resumenes = [...resumen.values()];
  const hectareas = resumenes.reduce((suma, r) => suma + r.hectareasEnCurso, 0);
  const mejor = cultivos
    .filter((cultivo) => resumen.get(cultivo.id)?.rendimiento)
    .sort((a, b) => (resumen.get(b.id)?.rendimiento ?? 0) - (resumen.get(a.id)?.rendimiento ?? 0))[0];

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="CATÁLOGO"
        titulo="Cultivos"
        descripcion="Especies que se pueden sembrar en una campaña."
        accion={
          puedeCrear ? (
            <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Nuevo cultivo'}
            </Button>
          ) : undefined
        }
      />

      {puedeCrear && mostrarFormulario && (
        <CultivoForm
          onGuardado={(nuevo) =>
            setCultivos((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
          }
        />
      )}

      {editando && (
        <CultivoForm
          key={editando.id}
          cultivo={editando}
          onGuardado={(actualizado) => {
            setCultivos((prev) =>
              prev.map((item) => (item.id === actualizado.id ? actualizado : item)).sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setEditando(null);
          }}
          onCerrar={() => setEditando(null)}
        />
      )}

      {loading && <div className="state-card">Cargando cultivos...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && cultivos.length === 0 && <EmptyState title="No hay cultivos registrados." />}
      {!loading && !error && cultivos.length > 0 && (
        <>
        <StatsGrid
          stats={[
            { etiqueta: 'Cultivos', valor: cultivos.length },
            { etiqueta: 'En producción', valor: resumenes.filter((r) => r.enCurso > 0).length },
            { etiqueta: 'Hectáreas en curso', valor: formatArea(hectareas) },
            { etiqueta: mejor ? `Mejor rendimiento (${mejor.nombre})` : 'Mejor rendimiento', valor: tPorHa(mejor && resumen.get(mejor.id)?.rendimiento) },
          ]}
        />
        <div className="barra-resultados">
          <ExportarBotones
            titulo="Cultivos"
            filas={cultivos}
            columnas={[
              { titulo: 'Cultivo', valor: (c) => c.nombre },
              { titulo: 'Ciclo (días)', valor: (c) => c.cicloDias },
              { titulo: 'Humedad estándar %', valor: (c) => c.humedadEstandarPct },
              { titulo: 'Campañas', valor: (c) => resumen.get(c.id)?.campanas },
              { titulo: 'En curso', valor: (c) => resumen.get(c.id)?.enCurso },
              { titulo: 'Hectáreas en curso', valor: (c) => resumen.get(c.id)?.hectareasEnCurso },
              { titulo: 'Rendimiento', valor: (c) => tPorHa(resumen.get(c.id)?.rendimiento) },
            ]}
          />
        </div>
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cultivo</th>
                  <th>Ciclo</th>
                  <th>Humedad estándar</th>
                  <th>Campañas</th>
                  <th>En curso</th>
                  <th>Rendimiento</th>
                  {puedeCrear && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cultivos.map((cultivo) => (
                  <tr key={cultivo.id}>
                    <td>{cultivo.nombre}</td>
                    <td>{cultivo.cicloDias ? `${cultivo.cicloDias} días` : '—'}</td>
                    <td>{cultivo.humedadEstandarPct != null ? `${String(cultivo.humedadEstandarPct).replace('.', ',')} %` : '—'}</td>
                    <td>{resumen.get(cultivo.id)?.campanas ?? 0}</td>
                    <td>{resumen.get(cultivo.id)?.enCurso ? formatArea(resumen.get(cultivo.id)?.hectareasEnCurso ?? 0) : '—'}</td>
                    <td>{tPorHa(resumen.get(cultivo.id)?.rendimiento)}</td>
                    {puedeCrear && (
                      <td>
                        <Button variant="secondary" size="sm" type="button" onClick={() => setEditando(cultivo)}>Editar</Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </section>
  );
}
