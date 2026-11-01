import { Sprout } from 'lucide-react';
import { NavLink } from 'react-router';
import { useAuth } from '../../features/auth/context/useAuth';
import type { Seccion } from '../../features/auth/permisos';
import { ICONO_SECCION } from '../../shared/utils/iconos';

const menuItems: { to: string; label: string; seccion: Seccion; end?: boolean }[] = [
  { to: '/', label: 'Inicio', seccion: 'inicio', end: true },
  { to: '/predios', label: 'Predios', seccion: 'predios' },
  { to: '/parcelas', label: 'Parcelas', seccion: 'parcelas' },
  { to: '/cultivos', label: 'Cultivos', seccion: 'cultivos' },
  { to: '/campanas', label: 'Campañas', seccion: 'campanas' },
  { to: '/labores', label: 'Labores', seccion: 'labores' },
  { to: '/insumos', label: 'Insumos', seccion: 'insumos' },
  { to: '/cosechas', label: 'Cosechas', seccion: 'cosechas' },
  { to: '/incidencias', label: 'Incidencias', seccion: 'incidencias' },
  { to: '/usuarios', label: 'Usuarios', seccion: 'usuarios' },
  { to: '/auditoria', label: 'Auditoría', seccion: 'auditoria' },
];

export default function Sidebar() {
  const { sesion, puedeVer } = useAuth();
  // El operario solo tiene su agenda: el menú lo dice con sus palabras
  const etiqueta = (item: (typeof menuItems)[number]) =>
    item.seccion === 'labores' && sesion?.rol === 'OPERARIO' ? 'Mis labores' : item.label;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark"><Sprout size={22} aria-hidden /></span>
        <div>
          <strong>AgroControl</strong>
          <small>Gestión agrícola</small>
        </div>
      </div>
      <nav className="sidebar__nav" aria-label="Navegación principal">
        {menuItems.filter((item) => puedeVer(item.seccion)).map((item) => {
          const Icono = ICONO_SECCION[item.seccion];
          return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <Icono size={18} strokeWidth={2} aria-hidden />
            {etiqueta(item)}
          </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
