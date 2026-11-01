import {
  ArrowDown, ArrowUp, Minus, ArrowDownToLine, Ban, CloudLightning, KeyRound, SlidersHorizontal, Undo2, ArrowLeftRight, ArrowUpFromLine, BookOpen, CalendarClock, CalendarDays, CalendarPlus, CalendarRange,
  ChartColumn, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleCheckBig, CircleOff, ClipboardList,
  ClipboardPlus, Clock, Eraser, FlaskConical, Flag, Fuel, Grid2x2, Hand, House, Inbox, Layers, Leaf, LandPlot, LogIn,
  LogOut, Moon, Package, PackageX, Pencil, Play, Plus, RotateCw, Save, ScrollText, SearchX, ShieldCheck, SprayCan,
  Sprout, Tractor, Trash2, TrendingUp, TriangleAlert, UserPlus, UserX, Users, Warehouse, Wheat, Wrench, X, Droplets,
  type LucideIcon,
} from 'lucide-react';
import type { Seccion } from '../../features/auth/permisos';

// Un solo lugar para decidir qué ícono acompaña a cada cosa, igual que StatusBadge elige color por nombre.
type Regla = [RegExp, LucideIcon];
const buscar = (reglas: Regla[], texto: string) => reglas.find(([patron]) => patron.test(texto))?.[1];

export const ICONO_SECCION: Record<Seccion, LucideIcon> = {
  inicio: House,
  predios: LandPlot,
  parcelas: Grid2x2,
  cultivos: Sprout,
  campanas: CalendarRange,
  labores: Tractor,
  insumos: Warehouse,
  cosechas: Wheat,
  incidencias: TriangleAlert,
  usuarios: Users,
  auditoria: ScrollText,
};

const ICONO_LABOR: Record<string, LucideIcon> = {
  SIEMBRA: Sprout,
  FERTILIZACION: FlaskConical,
  FUMIGACION: SprayCan,
  RIEGO: Droplets,
  CONTROL_MALEZAS: Leaf,
  COSECHA: Wheat,
};
export const iconoLabor = (tipo: string) => ICONO_LABOR[tipo] ?? Tractor;

export const ICONO_ESTADO: Record<string, LucideIcon> = {
  ACTIVO: CircleCheck,
  DISPONIBLE: CircleCheck,
  ENTRADA: ArrowDownToLine,
  SALIDA: ArrowUpFromLine,
  PLANIFICADA: CalendarClock,
  EN_CURSO: Play,
  EN_PRODUCCION: Sprout,
  EJECUTADA: CircleCheckBig,
  RESUELTA: CircleCheckBig,
  FINALIZADA: CircleCheckBig,
  ABIERTA: CircleAlert,
  CANCELADA: Ban,
  PERDIDA: CloudLightning,
  ANULADO: Ban,
  EN_ATENCION: Wrench,
  EN_DESCANSO: Moon,
  INACTIVO: CircleOff,
  BAJA: ArrowDown,
  MEDIA: Minus,
  ALTA: ArrowUp,
};

const REGLAS_BOTON: Regla[] = [
  [/^\+/, Plus],
  [/^(cerrar|cancelar)$|^cerrar formulario/i, X],
  [/^anular/i, Ban],
  [/^desactivar/i, CircleOff],
  [/^activar/i, CircleCheck],
  [/^ajustar/i, SlidersHorizontal],
  [/^agregar/i, Plus],
  [/^reabrir/i, Undo2],
  [/perdid/i, CloudLightning],
  [/contrase|clave/i, KeyRound],
  [/^salir/i, LogOut],
  [/^ingresar/i, LogIn],
  [/^guardar/i, Save],
  [/^editar/i, Pencil],
  [/^eliminar/i, Trash2],
  [/bit[aá]cora/i, BookOpen],
  [/^iniciar/i, Play],
  [/^finalizar/i, Flag],
  [/^avance/i, ChartColumn],
  [/^asignar/i, UserPlus],
  [/^ejecutar/i, CircleCheck],
  [/^insumos/i, Package],
  [/^atender/i, Hand],
  [/resuelta|^resolver/i, CircleCheckBig],
  [/^(entrada|movimientos)/i, ArrowLeftRight],
  [/^planificar/i, CalendarPlus],
  [/^registrar/i, ClipboardPlus],
  [/^crear/i, Plus],
  [/^limpiar/i, Eraser],
  [/^recargar/i, RotateCw],
  [/^anterior/i, ChevronLeft],
  [/^siguiente/i, ChevronRight],
];
// "Guardando..." no lleva ícono mientras espera.
export const iconoBoton = (texto: string) => (texto.endsWith('...') ? undefined : buscar(REGLAS_BOTON, texto));

const REGLAS_STAT: Regla[] = [
  [/sin stock|agotarse/i, PackageX],
  [/sin operario/i, UserX],
  [/atrasad/i, CalendarClock],
  [/sin resolver/i, CircleAlert],
  [/inactiv/i, CircleOff],
  [/hect[aá]rea/i, LandPlot],
  [/pendiente/i, Clock],
  [/en curso/i, Play],
  [/planificad/i, CalendarClock],
  [/ejecutad|finalizad/i, CircleCheckBig],
  [/avance/i, TrendingUp],
  [/usuario|asignadas/i, Users],
  [/predio/i, LandPlot],
  [/parcela|disponible/i, Grid2x2],
  [/[aá]rea/i, LandPlot],
  [/campa/i, CalendarRange],
  [/labor/i, Tractor],
  [/insumo/i, Package],
  [/combustible/i, Fuel],
  [/repuesto/i, Wrench],
  [/cosech|tonelada/i, Wheat],
  [/rol/i, ShieldCheck],
  [/d[ií]as/i, CalendarDays],
  [/registr|cambio/i, ClipboardList],
];
export const iconoEstadistica = (etiqueta: string) => buscar(REGLAS_STAT, etiqueta) ?? Layers;

export type Tono = 'base' | 'ok' | 'aviso' | 'info' | 'alerta';
export function tonoEstadistica(etiqueta: string, valor: string | number): Tono {
  if (/sin stock|agotarse|sin operario|sin resolver|inactiv|atrasad/i.test(etiqueta)) return Number(valor) === 0 ? 'base' : 'alerta';
  if (/pendiente|en curso/i.test(etiqueta)) return 'aviso';
  if (/planificad/i.test(etiqueta)) return 'info';
  if (/ejecutad|finalizad|activos|disponible|avance/i.test(etiqueta)) return 'ok';
  return 'base';
}

export const iconoVacio = (titulo: string) => (/sin resultados|coincide/i.test(titulo) ? SearchX : Inbox);
