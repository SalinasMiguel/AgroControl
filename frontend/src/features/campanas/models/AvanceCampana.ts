import type { CategoriaInsumo } from '../../insumos/models/Insumo';
import type { EstadoCampana } from './Campana';

// Respuesta de GET /api/campanas/{id}/avance (RF-15)
export interface AvanceCampana {
  campanaId: number;
  cultivo: string | null;
  estado: EstadoCampana;
  laboresTotal: number;
  laboresPlanificadas: number;
  laboresEnCurso: number;
  laboresEjecutadas: number;
  porcentajeLabores: number;
  diasTranscurridos: number;
  cicloDias: number | null;
  porcentajeCiclo: number | null;
  insumos: { insumoId: number; nombre: string; categoria: CategoriaInsumo; unidadMedida: string; cantidad: number }[];
  cosecha: { unidadMedida: string; cantidad: number }[];
  cosechaToneladas: number;
  rendimientoToneladasPorHa: number | null;
  incidenciasAbiertas: number;
  incidenciasTotal: number;
}
