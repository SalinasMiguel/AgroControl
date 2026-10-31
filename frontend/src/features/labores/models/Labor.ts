export type EstadoLabor = 'PLANIFICADA' | 'ASIGNADA' | 'EN_CURSO' | 'EJECUTADA' | 'CANCELADA';

export interface Labor {
  id: number;
  campanaId: number;
  parcelaId: number;
  tipo: string;
  fechaPlan: string;
  fechaEjecucion: string | null;
  estado: EstadoLabor;
  motivoCancelacion: string | null;
}

export interface AsignacionLabor {
  id: number;
  laborId: number;
  usuarioId: number;
  asignadoEn: string;
}

export interface ConsumoLabor {
  id: number;
  laborId: number;
  insumoId: number;
  cantidad: number;
  fecha: string;
  anulado: boolean;
  motivoAnulacion: string | null;
  anuladoPor: number | null;
  anuladoEn: string | null;
}

export const TIPOS_LABOR = ['SIEMBRA', 'FERTILIZACION', 'FUMIGACION', 'RIEGO', 'CONTROL_MALEZAS', 'COSECHA', 'OTRA'];
