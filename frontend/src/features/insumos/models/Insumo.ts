import {
  Droplet, FlaskConical, Fuel, Package, SprayCan, Sprout, Wrench, type LucideIcon,
} from 'lucide-react';

export type CategoriaInsumo =
  | 'SEMILLA' | 'FERTILIZANTE' | 'AGROQUIMICO' | 'COMBUSTIBLE' | 'LUBRICANTE' | 'REPUESTO' | 'OTRO';

// Orden, nombre e ícono (Lucide) con que se muestra cada categoría en todas las pantallas
export const CATEGORIAS: { valor: CategoriaInsumo; nombre: string; icono: LucideIcon; unidad: string }[] = [
  { valor: 'SEMILLA', nombre: 'Semillas', icono: Sprout, unidad: 'kg' },
  { valor: 'FERTILIZANTE', nombre: 'Fertilizantes', icono: FlaskConical, unidad: 'kg' },
  { valor: 'AGROQUIMICO', nombre: 'Agroquímicos', icono: SprayCan, unidad: 'L' },
  { valor: 'COMBUSTIBLE', nombre: 'Combustibles', icono: Fuel, unidad: 'L' },
  { valor: 'LUBRICANTE', nombre: 'Aceites y grasas', icono: Droplet, unidad: 'L' },
  { valor: 'REPUESTO', nombre: 'Repuestos', icono: Wrench, unidad: 'unidad' },
  { valor: 'OTRO', nombre: 'Otros', icono: Package, unidad: 'unidad' },
];

export const categoria = (valor: CategoriaInsumo) => CATEGORIAS.find((c) => c.valor === valor) ?? CATEGORIAS[CATEGORIAS.length - 1];

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  categoria: CategoriaInsumo;
  stockMinimo: number;
  porAgotarse: boolean;
  codigo: string | null;
  marca: string | null;
}

// GET /api/insumos/salidas: lo que salió del almacén en el período
export interface SalidaDeAlmacen {
  insumoId: number;
  nombre: string;
  categoria: CategoriaInsumo;
  unidadMedida: string;
  cantidad: number;
  movimientos: number;
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export type OrigenMovimiento = 'MANUAL' | 'CONSUMO' | 'ANULACION' | 'AJUSTE';

export interface MovimientoInsumo {
  id: number;
  insumoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  usuarioId: number;
  fecha: string;
  origen: OrigenMovimiento;
  anulado: boolean;
  motivoAnulacion: string | null;
  anuladoPor: number | null;
  anuladoEn: string | null;
  proveedor: string | null;
  numeroFactura: string | null;
}

// Un consumo se anula desde su labor y una reversión no se revierte.
export const esAnulable = (movimiento: MovimientoInsumo) =>
  !movimiento.anulado && (movimiento.origen === 'MANUAL' || movimiento.origen === 'AJUSTE');
