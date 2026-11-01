import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { Seccion } from '../../features/auth/permisos';
import { ICONO_SECCION } from '../../shared/utils/iconos';

interface PageHeadingProps {
  eyebrow: string;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}

export default function PageHeading({ eyebrow, titulo, descripcion, accion }: PageHeadingProps) {
  const { pathname } = useLocation();
  const Icono = ICONO_SECCION[pathname.split('/')[1] as Seccion];

  return (
    <div className="page-heading page-heading--actions">
      <div className="page-heading__titulo">
        {Icono && <span className="page-heading__icono"><Icono size={26} aria-hidden /></span>}
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{titulo}</h1>
          <p>{descripcion}</p>
        </div>
      </div>
      {accion}
    </div>
  );
}
