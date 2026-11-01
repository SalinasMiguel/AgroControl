import { ICONO_ESTADO } from '../../shared/utils/iconos';

// Genérico: recibe el texto del estado (no conoce modelos de dominio) y elige el color por nombre.
const clasePorEstado: Record<string, string> = {
  ACTIVO: 'status-active',
  DISPONIBLE: 'status-active',
  ENTRADA: 'status-active',
  PLANIFICADA: 'status-planned',
  EN_CURSO: 'status-progress',
  EN_PRODUCCION: 'status-progress',
  EJECUTADA: 'status-done',
  ABIERTA: 'status-inactive',
  EN_ATENCION: 'status-progress',
  RESUELTA: 'status-done',
  FINALIZADA: 'status-done',
  EN_DESCANSO: 'status-neutral',
  INACTIVO: 'status-inactive',
  SALIDA: 'status-inactive',
};

interface StatusBadgeProps {
  estado: string;
}

export default function StatusBadge({ estado }: StatusBadgeProps) {
  const clase = clasePorEstado[estado] ?? 'status-neutral';
  const Icono = ICONO_ESTADO[estado];
  return (
    <span className={`status-badge ${clase}`}>
      {Icono && <Icono size={13} aria-hidden />}
      {estado.replace(/_/g, ' ')}
    </span>
  );
}
