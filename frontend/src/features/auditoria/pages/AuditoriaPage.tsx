import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import ExportarBotones from '../../../components/ui/ExportarBotones';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import { usePaginacion } from '../../../hooks/usePaginacion';
import { coincideBusqueda } from '../../../shared/utils/texto';
import { useCarga } from '../../../hooks/useCarga';
import type { Usuario } from '../../usuarios/models/Usuario';
import { usuarioService } from '../../usuarios/services/usuarioService';
import type { RegistroAuditoria } from '../models/Auditoria';
import { auditoriaService } from '../services/auditoriaService';

const ENTIDADES: Record<string, string> = {
  PREDIO: 'Predio',
  PARCELA: 'Parcela',
  CULTIVO: 'Cultivo',
  CAMPANA: 'Campaña',
  LABOR: 'Labor',
  ASIGNACION_LABOR: 'Asignación de labor',
  INSUMO: 'Insumo',
  MOVIMIENTO_INSUMO: 'Movimiento de insumo',
  CONSUMO_LABOR: 'Consumo en labor',
  COSECHA: 'Cosecha',
  INCIDENCIA: 'Incidencia',
  USUARIO: 'Usuario',
  ROL: 'Rol',
};

const cargar = (entidad: string) => async (signal: AbortSignal) => {
  const [registros, usuarios] = await Promise.all([
    auditoriaService.listar(entidad, signal),
    usuarioService.listar(signal),
  ]);
  return { registros, usuarios };
};

const fechaHora = (iso: string) => {
  const [fecha, hora] = iso.split('T');
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio} ${hora?.slice(0, 5) ?? ''}`;
};

// RF-16: quién cambió qué y cuándo (solo administrador)
export default function AuditoriaPage() {
  const [entidad, setEntidad] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const { datos, loading, error } = useCarga(
    cargar(entidad),
    { registros: [] as RegistroAuditoria[], usuarios: [] as Usuario[] },
    entidad,
  );
  const { registros, usuarios } = datos;

  const autor = (id: number | null) =>
    id === null ? 'Sistema' : usuarios.find((usuario) => usuario.id === id)?.nombreCompleto ?? `Usuario ${id}`;
  const nombreEntidad = (registro: RegistroAuditoria) => ENTIDADES[registro.entidad] ?? registro.entidad;
  const visibles = registros.filter((registro) =>
    coincideBusqueda(busqueda, autor(registro.usuarioId), registro.accion, nombreEntidad(registro), registro.detalle));
  const { pagina, props: paginacion } = usePaginacion(visibles, `${entidad}|${busqueda}`, 20);
  const usuariosDistintos = new Set(registros.map((registro) => registro.usuarioId)).size;

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="ADMINISTRACIÓN"
        titulo="Auditoría"
        descripcion="Cambios críticos registrados automáticamente: quién, sobre qué y cuándo. Se muestran los últimos 500."
      />

      <div className="filter-bar">
        <SearchInput label="Buscar" value={busqueda} onChange={setBusqueda} placeholder="Usuario, acción o detalle" />
        <div className="filter-field">
          <label htmlFor="filtro-entidad">Entidad</label>
          <select id="filtro-entidad" value={entidad} onChange={(e) => setEntidad(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(ENTIDADES).map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
        </div>
        <ExportarBotones
          titulo="Auditoría"
          filas={visibles}
          columnas={[
            { titulo: 'Fecha', valor: (r) => fechaHora(r.fecha) },
            { titulo: 'Usuario', valor: (r) => autor(r.usuarioId) },
            { titulo: 'Acción', valor: (r) => r.accion },
            { titulo: 'Entidad', valor: nombreEntidad },
            { titulo: 'Id', valor: (r) => r.idEntidad },
            { titulo: 'Detalle', valor: (r) => r.detalle },
          ]}
        />
      </div>

      {loading && <div className="state-card">Cargando auditoría...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Cambios', valor: registros.length },
              { etiqueta: 'Usuarios', valor: usuariosDistintos },
            ]}
          />
          {visibles.length === 0 ? (
            <div className="empty-state">No hay cambios registrados{entidad ? ' para esta entidad' : ''}.</div>
          ) : (
            <>
            <div className="table-card">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Id</th><th>Detalle</th></tr>
                  </thead>
                  <tbody>
                    {pagina.items.map((registro) => (
                      <tr key={registro.id}>
                        <td>{fechaHora(registro.fecha)}</td>
                        <td>{autor(registro.usuarioId)}</td>
                        <td>{registro.accion}</td>
                        <td>{nombreEntidad(registro)}</td>
                        <td className="code-cell">#{registro.idEntidad}</td>
                        <td className="muted">{registro.detalle || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination {...paginacion} />
            </>
          )}
        </>
      )}
    </section>
  );
}
