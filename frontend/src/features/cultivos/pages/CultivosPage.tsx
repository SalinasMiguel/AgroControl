import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import { useCarga } from '../../../hooks/useCarga';
import { useAuth } from '../../auth/context/useAuth';
import CultivoForm from '../components/CultivoForm';
import type { Cultivo } from '../models/Cultivo';
import { cultivoService } from '../services/cultivoService';

const cargarCultivos = (signal: AbortSignal) => cultivoService.listar(signal);

export default function CultivosPage() {
  const { datos: cultivos, setDatos: setCultivos, loading, error } = useCarga<Cultivo[]>(cargarCultivos, []);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeCrear = useAuth().puede('cultivos.crear');
  const [editando, setEditando] = useState<Cultivo | null>(null);

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="CATÁLOGO"
        titulo="Cultivos"
        descripcion="Especies que se pueden sembrar en una campaña."
        accion={
          puedeCrear ? (
            <button type="button" className="btn-primary" onClick={() => setMostrarFormulario((prev) => !prev)}>
              {mostrarFormulario ? 'Cerrar formulario' : '+ Nuevo cultivo'}
            </button>
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
      {!loading && !error && cultivos.length === 0 && <div className="empty-state">No hay cultivos registrados.</div>}
      {!loading && !error && cultivos.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cultivo</th>
                  <th>Ciclo</th>
                  {puedeCrear && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cultivos.map((cultivo) => (
                  <tr key={cultivo.id}>
                    <td>{cultivo.id}</td>
                    <td>{cultivo.nombre}</td>
                    <td>{cultivo.cicloDias ? `${cultivo.cicloDias} días` : '—'}</td>
                    {puedeCrear && (
                      <td>
                        <button type="button" className="btn-link" onClick={() => setEditando(cultivo)}>Editar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
