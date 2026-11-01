export type EstadoParcela = 'DISPONIBLE' | 'EN_PRODUCCION' | 'EN_DESCANSO';

export interface Parcela {
  id: number;
  predioId: number;
  codigo: string;
  areaHa: number | null;
  estado: EstadoParcela;
}

export const ESTADOS_PARCELA: EstadoParcela[] = ['DISPONIBLE', 'EN_PRODUCCION', 'EN_DESCANSO'];

// EN_PRODUCCION lo pone la campaña al iniciar: no se elige a mano.
export const ESTADOS_MANUALES: EstadoParcela[] = ['DISPONIBLE', 'EN_DESCANSO'];
