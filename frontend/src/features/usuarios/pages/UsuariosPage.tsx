import { useState } from 'react';
import PageHeading from '../../../components/common/PageHeading';
import StatsGrid from '../../../components/common/StatsGrid';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import { useCarga } from '../../../hooks/useCarga';
import { formatFecha } from '../../../utils/formato';
import type { Rol } from '../../auth/models/Sesion';
import { useSesion } from '../../auth/context/useAuth';
import { NOMBRE_ROL } from '../../auth/permisos';
import ClaveTemporalDialog from '../components/ClaveTemporalDialog';
import UsuarioForm from '../components/UsuarioForm';
import type { RolCatalogo } from '../models/Rol';
import type { Usuario } from '../models/Usuario';
import { rolService } from '../services/rolService';
import { usuarioService } from '../services/usuarioService';
import Button from '../../../components/ui/Button';

type Accion = 'desactivar' | 'activar' | 'restablecer';

const TEXTO_ACCION: Record<Accion, { titulo: string; mensaje: (nombre: string) => string; boton: string; enCurso: string }> = {
  desactivar: {
    titulo: 'Desactivar usuario',
    mensaje: (nombre) => `${nombre} ya no podrá entrar y su sesión abierta se cerrará.`,
    boton: 'Desactivar',
    enCurso: 'Desactivando...',
  },
  activar: {
    titulo: 'Activar usuario',
    mensaje: (nombre) => `${nombre} podrá volver a entrar.`,
    boton: 'Activar',
    enCurso: 'Activando...',
  },
  restablecer: {
    titulo: 'Restablecer contraseña',
    mensaje: (nombre) => `Se generará una contraseña temporal para ${nombre} y su sesión abierta se cerrará.`,
    boton: 'Restablecer',
    enCurso: 'Restableciendo...',
  },
};

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
  const sesion = useSesion();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [pendiente, setPendiente] = useState<{ accion: Accion; usuario: Usuario } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [temporal, setTemporal] = useState<{ clave: string; nombre: string } | null>(null);

  const reemplazar = (actualizado: Usuario) =>
    setDatos((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((usuario) => (usuario.id === actualizado.id ? actualizado : usuario)),
    }));

  const confirmar = async () => {
    if (!pendiente) return;
    const { accion, usuario } = pendiente;
    try {
      setProcesando(true);
      setErrorAccion('');
      if (accion === 'restablecer') {
        const { passwordTemporal } = await usuarioService.restablecer(usuario.id);
        setTemporal({ clave: passwordTemporal, nombre: usuario.nombreCompleto });
      } else {
        reemplazar(await usuarioService[accion](usuario.id));
      }
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setProcesando(false);
      setPendiente(null);
    }
  };

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
          onGuardado={(nuevo) => setDatos((prev) => ({ ...prev, usuarios: [...prev.usuarios, nuevo] }))}
        />
      )}

      {errorAccion && <div className="form-error" role="alert">{errorAccion}</div>}
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
                  <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Alta</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombreCompleto}</td>
                      <td>{usuario.email}</td>
                      <td>{nombreRol(usuario.rolId)}</td>
                      <td>{formatFecha(usuario.creadoEn)}</td>
                      <td><StatusBadge estado={usuario.estado} /></td>
                      <td>
                        <div className="table-actions">
                          <Button variant="secondary" type="button" onClick={() => setEditando(usuario)}>
                            Editar
                          </Button>
                          {usuario.estado === 'INACTIVO' ? (
                            <Button variant="secondary"
                              type="button"
                              onClick={() => setPendiente({ accion: 'activar', usuario })}
                            >
                              Activar
                            </Button>
                          ) : (
                            usuario.id !== sesion.usuarioId && (
                              <Button variant="secondary"
                                type="button"
                                onClick={() => setPendiente({ accion: 'desactivar', usuario })}
                              >
                                Desactivar
                              </Button>
                            )
                          )}
                          <Button variant="secondary"
                            type="button"
                            onClick={() => setPendiente({ accion: 'restablecer', usuario })}
                          >
                            Restablecer clave
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal open={editando !== null} title="Editar usuario" onClose={() => setEditando(null)}>
        {editando && (
          <UsuarioForm
            key={editando.id}
            roles={roles}
            usuario={editando}
            onGuardado={(actualizado) => {
              reemplazar(actualizado);
              setEditando(null);
            }}
            onCerrar={() => setEditando(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={pendiente !== null}
        title={pendiente ? TEXTO_ACCION[pendiente.accion].titulo : ''}
        message={pendiente ? TEXTO_ACCION[pendiente.accion].mensaje(pendiente.usuario.nombreCompleto) : ''}
        confirmLabel={pendiente ? TEXTO_ACCION[pendiente.accion].boton : undefined}
        loadingLabel={pendiente ? TEXTO_ACCION[pendiente.accion].enCurso : undefined}
        loading={procesando}
        onConfirm={() => void confirmar()}
        onCancel={() => setPendiente(null)}
      />

      <ClaveTemporalDialog
        clave={temporal?.clave ?? null}
        nombre={temporal?.nombre ?? ''}
        onCerrar={() => setTemporal(null)}
      />
    </section>
  );
}
