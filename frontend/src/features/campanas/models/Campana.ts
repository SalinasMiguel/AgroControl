export type EstadoCampana = 'PLANIFICADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA' | 'PERDIDA';

export interface Campana {
  id: number;
  parcelaId: number;
  cultivoId: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoCampana;
  motivoCierre: string | null;
  areaSembradaHa: number | null;
  variedad: string | null;
  fechaCosechaEstimada: string | null;
}
