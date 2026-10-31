import type { Campana, Cosecha, Cultivo, Incidencia, Labor, Parcela, Predio } from "../models/agro";

// Registros ficticios para practicar; no vienen del backend.
export const PREDIOS: readonly Predio[] = [
  { id: 1, nombre: "Fundo San José", ubicacion: "Warnes", areaHa: 75, activo: true },
  { id: 2, nombre: "Fundo Las Palmeras", ubicacion: "Montero", areaHa: 50, activo: true },
  { id: 3, nombre: "Predio El Retiro", ubicacion: "Cotoca", areaHa: 40, activo: false },
  { id: 4, nombre: "Predio Nuevo Horizonte", ubicacion: "Pailón", areaHa: 20, activo: true },
];

// San José: 2 parcelas · Las Palmeras: 1 · El Retiro (inactivo): 2 · Nuevo Horizonte: 0
export const PARCELAS: readonly Parcela[] = [
  { id: 101, predioId: 1, codigo: "P-01", areaHa: 45, estado: "EN_PRODUCCION" },
  { id: 102, predioId: 1, codigo: "P-02", areaHa: 30, estado: "DISPONIBLE" },
  { id: 103, predioId: 2, codigo: "P-01", areaHa: 50, estado: "EN_PRODUCCION" },
  { id: 104, predioId: 3, codigo: "P-01", areaHa: 25, estado: "EN_DESCANSO" },
  { id: 105, predioId: 3, codigo: "P-02", areaHa: 15, estado: "EN_DESCANSO" },
];

// Mismos cultivos que la semilla de la base de datos.
export const CULTIVOS: readonly Cultivo[] = [
  { id: 1, nombre: "Soya", cicloDias: 120 },
  { id: 2, nombre: "Maíz", cicloDias: 140 },
  { id: 3, nombre: "Sorgo", cicloDias: 110 },
];

// Una campaña = un cultivo sembrado en una parcela desde una fecha.
// Las FINALIZADAS son el historial de la parcela.
export const CAMPANAS: readonly Campana[] = [
  { id: 1, parcelaId: 101, cultivoId: 1, fechaInicio: "2026-08-18", fechaFin: null, estado: "EN_CURSO" },
  { id: 2, parcelaId: 103, cultivoId: 2, fechaInicio: "2026-09-28", fechaFin: null, estado: "EN_CURSO" },
  { id: 3, parcelaId: 102, cultivoId: 3, fechaInicio: "2026-11-05", fechaFin: null, estado: "PLANIFICADA" },
  { id: 4, parcelaId: 101, cultivoId: 2, fechaInicio: "2026-01-10", fechaFin: "2026-05-30", estado: "FINALIZADA" },
  { id: 5, parcelaId: 104, cultivoId: 1, fechaInicio: "2025-11-15", fechaFin: "2026-03-20", estado: "FINALIZADA" },
  { id: 6, parcelaId: 102, cultivoId: 1, fechaInicio: "2025-12-01", fechaFin: "2026-04-05", estado: "FINALIZADA" },
];

// Trabajo de campo de cada campaña, en el orden en que se hace.
export const LABORES: readonly Labor[] = [
  { id: 1, campanaId: 1, tipo: "SIEMBRA", fechaPlan: "2026-08-18", fechaEjecucion: "2026-08-18", estado: "EJECUTADA" },
  { id: 2, campanaId: 1, tipo: "FERTILIZACION", fechaPlan: "2026-09-10", fechaEjecucion: "2026-09-11", estado: "EJECUTADA" },
  { id: 3, campanaId: 1, tipo: "FUMIGACION", fechaPlan: "2026-10-22", fechaEjecucion: null, estado: "EN_CURSO" },
  { id: 4, campanaId: 1, tipo: "RIEGO", fechaPlan: "2026-10-30", fechaEjecucion: null, estado: "PLANIFICADA" },
  { id: 5, campanaId: 2, tipo: "SIEMBRA", fechaPlan: "2026-09-28", fechaEjecucion: "2026-09-28", estado: "EJECUTADA" },
  { id: 6, campanaId: 2, tipo: "RIEGO", fechaPlan: "2026-10-27", fechaEjecucion: null, estado: "PLANIFICADA" },
  { id: 7, campanaId: 3, tipo: "SIEMBRA", fechaPlan: "2026-11-05", fechaEjecucion: null, estado: "PLANIFICADA" },
];

// Lo cosechado en las campañas ya cerradas (para el rendimiento del historial).
export const COSECHAS: readonly Cosecha[] = [
  { id: 1, campanaId: 4, cantidad: 315, unidadMedida: "t", toneladas: 315 },
  { id: 2, campanaId: 5, cantidad: 72, unidadMedida: "t", toneladas: 72 },
  { id: 3, campanaId: 6, cantidad: 87000, unidadMedida: "kg", toneladas: 87 },
];

export const INCIDENCIAS: readonly Incidencia[] = [
  { id: 1, parcelaId: 101, descripcion: "Gusano cogollero en el borde norte", fecha: "2026-10-20", estado: "ABIERTA" },
  { id: 2, parcelaId: 103, descripcion: "Falla en la bomba de riego", fecha: "2026-10-15", estado: "EN_ATENCION" },
  { id: 3, parcelaId: 104, descripcion: "Erosión en la cabecera tras la lluvia", fecha: "2026-03-02", estado: "RESUELTA" },
];

// Todo junto, con la misma forma que devuelve cargarDatos() del backend.
export const DATOS_DEMO = {
  predios: PREDIOS,
  parcelas: PARCELAS,
  cultivos: CULTIVOS,
  campanas: CAMPANAS,
  labores: LABORES,
  cosechas: COSECHAS,
  incidencias: INCIDENCIAS,
} as const;
