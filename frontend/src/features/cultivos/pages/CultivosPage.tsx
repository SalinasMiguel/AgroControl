import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import { useCarga } from '../../../hooks/useCarga';
import { useAuth } from '../../auth/context/useAuth';
import CultivoForm from '../components/CultivoForm';
import type { Cultivo } from '../models/Cultivo';
import { cultivoService } from '../services/cultivoService';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

const cargarCultivos = (signal: AbortSignal) => cultivoService.listar(signal);

export default function CultivosPage() {
  const { datos: cultivos, setDatos: setCultivos, loading, error } = useCarga<Cultivo[]>(cargarCultivos, []);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const puedeCrear = useAuth().puede('cultivos.crear');

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
          onCreated={(nuevo) =>
            setCultivos((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
          }
        />
      )}

      {loading && <div className="state-card">Cargando cultivos...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && cultivos.length === 0 && <EmptyState title="No hay cultivos registrados." />}
      {!loading && !error && cultivos.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cultivo</th>
                  <th>Ciclo</th>
                </tr>
              </thead>
              <tbody>
                {cultivos.map((cultivo) => (
                  <tr key={cultivo.id}>
                    <td>{cultivo.id}</td>
                    <td>{cultivo.nombre}</td>
                    <td>{cultivo.cicloDias ? `${cultivo.cicloDias} días` : '—'}</td>
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
