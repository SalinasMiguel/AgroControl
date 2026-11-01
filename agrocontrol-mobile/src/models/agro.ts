// Contratos tipados: describen la forma de los datos, no los almacenan.
export type Predio = Readonly<{
  id: number;
  nombre: string;
  ubicacion: string;
  areaHa: number;
  activo: boolean;
}>;

export type EstadoParcela = "DISPONIBLE" | "EN_PRODUCCION" | "EN_DESCANSO";

export type Parcela = Readonly<{
  id: number;
  predioId: number; // vínculo 1:N con Predio (todavía no es una foreign key real)
  codigo: string;
  areaHa: number;
  estado: EstadoParcela;
}>;

// Espejo de las entidades Cultivo y Campana del backend.
export type Cultivo = Readonly<{
  id: number;
  nombre: string;
  cicloDias: number | null; // días desde la siembra hasta la cosecha
}>;

export type EstadoCampana = "PLANIFICADA" | "EN_CURSO" | "FINALIZADA" | "CANCELADA" | "PERDIDA";

export type Campana = Readonly<{
  id: number;
  parcelaId: number;
  cultivoId: number;
  fechaInicio: string; // ISO "AAAA-MM-DD": día de siembra
  fechaFin: string | null; // solo las FINALIZADAS
  estado: EstadoCampana;
}>;

// Espejo de Labor del backend: el trabajo planificado dentro de una campaña.
export type EstadoLabor = "PLANIFICADA" | "ASIGNADA" | "EN_CURSO" | "EJECUTADA" | "CANCELADA";

export type Labor = Readonly<{
  id: number;
  campanaId: number;
  tipo: string;
  fechaPlan: string;
  fechaEjecucion: string | null;
  estado: EstadoLabor;
}>;

export type Cosecha = Readonly<{
  id: number;
  campanaId: number;
  cantidad: number;
  unidadMedida: string;
  toneladas: number; // el backend convierte: un quintal son 46 kg
}>;

export type EstadoIncidencia = "ABIERTA" | "EN_ATENCION" | "RESUELTA" | "ANULADA";

export type Incidencia = Readonly<{
  id: number;
  parcelaId: number;
  descripcion: string;
  fecha: string;
  estado: EstadoIncidencia;
}>;

export type Seccion = "predios" | "parcelas";
