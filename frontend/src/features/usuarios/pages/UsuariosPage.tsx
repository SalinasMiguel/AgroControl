import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useCarga } from '../../../hooks/useCarga';
import { formatFecha } from '../../../utils/formato';
import type { Rol } from '../../auth/models/Sesion';
import { NOMBRE_ROL } from '../../auth/permisos';
import UsuarioForm from '../components/UsuarioForm';
import type { RolCatalogo } from '../models/Rol';
import type { Usuario } from '../models/Usuario';
import { rolService } from '../services/rolService';
import { usuarioService } from '../services/usuarioService';
import Button from '../../../components/ui/Button';

const cargarDatos = async (signal: AbortSignal) => {
  const [usuarios, roles] = await Promise.all([usuarioService.listar(signal), rolService.listar(signal)]);
  return { usuarios, roles };
};

// Solo el administrador llega aquí (RequireSeccion + 403 del backend en POST /usuarios).
export default function UsuariosPage() {
  const { datos, setDatos, loading, error } = useCarga(cargarDatos, {
    usuarios: [] as Usuario[],
    roles: [] as RolCatalogo[],
  });
  const { usuarios, roles } = datos;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const nombreRol = (rolId: number) => {
    const nombre = roles.find((rol) => rol.id === rolId)?.nombre;
    return nombre ? (NOMBRE_ROL[nombre as Rol] ?? nombre) : `Rol ${rolId}`;
  };
  const activos = usuarios.filter((usuario) => usuario.estado === 'ACTIVO').length;

  return (
    <section className="feature-page">
      <PageHeading
        eyebrow="ADMINISTRACIÓN"
        titulo="Usuarios"
        descripcion="Cuentas del sistema y el rol que define qué ve y qué puede hacer cada una."
        accion={
          <Button type="button" onClick={() => setMostrarFormulario((prev) => !prev)}>
            {mostrarFormulario ? 'Cerrar formulario' : '+ Nuevo usuario'}
          </Button>
        }
      />

      {mostrarFormulario && (
        <UsuarioForm
          roles={roles}
          onCreated={(nuevo) => setDatos((prev) => ({ ...prev, usuarios: [...prev.usuarios, nuevo] }))}
        />
      )}

      {loading && <div className="state-card">Cargando usuarios...</div>}
      {!loading && error && <div className="state-card error">{error}</div>}
      {!loading && !error && (
        <>
          <StatsGrid
            stats={[
              { etiqueta: 'Usuarios', valor: usuarios.length },
              { etiqueta: 'Activos', valor: activos },
              { etiqueta: 'Roles', valor: roles.length },
            ]}
          />
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Alta</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombreCompleto}</td>
                      <td>{usuario.email}</td>
                      <td>{nombreRol(usuario.rolId)}</td>
                      <td>{formatFecha(usuario.creadoEn)}</td>
                      <td><StatusBadge estado={usuario.estado} /></td>
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
