import type { Campana, Cultivo } from "../models/agro";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// "AAAA-MM-DD" como fecha local (new Date("AAAA-MM-DD") la tomaría en UTC).
function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function formatearFecha(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

export type NombreEtapa = "Germinación" | "Crecimiento" | "Maduración" | "Lista para cosecha";
export type Etapa = Readonly<{ nombre: NombreEtapa }>;

// Etapa según el avance del ciclo; los cortes son aproximados.
function etapaPorAvance(avance: number): Etapa {
  if (avance < 0.15) return { nombre: "Germinación" };
  if (avance < 0.6) return { nombre: "Crecimiento" };
  if (avance < 1) return { nombre: "Maduración" };
  return { nombre: "Lista para cosecha" };
}

export type AvanceSiembra = Readonly<{
  dia: number; // días desde la siembra (0 si aún no empieza)
  cicloDias: number | null;
  avance: number; // 0..1; 0 si el cultivo no tiene ciclo cargado
  etapa: Etapa;
  fechaSiembra: Date;
  fechaCosecha: Date | null;
}>;

// Todo se deriva de fechaInicio + cicloDias: el avance no se guarda.
export function calcularAvance(campana: Campana, cultivo: Cultivo, hoy: Date = new Date()): AvanceSiembra {
  const fechaSiembra = aFecha(campana.fechaInicio);
  const dia = Math.max(0, Math.floor((hoy.getTime() - fechaSiembra.getTime()) / MS_POR_DIA));
  const ciclo = cultivo.cicloDias;
  const avance = ciclo ? Math.min(1, dia / ciclo) : 0;
  const fechaCosecha = ciclo ? new Date(fechaSiembra.getTime() + ciclo * MS_POR_DIA) : null;
  return { dia, cicloDias: ciclo, avance, etapa: etapaPorAvance(avance), fechaSiembra, fechaCosecha };
}

// Vencida: su fecha ya pasó, comparando días locales (hoy mismo todavía no está atrasada).
export function esAtrasada(fechaIso: string, hoy: Date = new Date()): boolean {
  return aFecha(fechaIso) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
}

// "AAAA-MM-DD" → "DD/MM/AAAA"
export function formatearFechaIso(iso: string): string {
  return formatearFecha(aFecha(iso));
}
