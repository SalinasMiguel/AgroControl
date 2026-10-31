import { Platform } from "react-native";

import type { Campana, Cosecha, Cultivo, Incidencia, Labor, Parcela, Predio } from "../models/agro";

// El emulador de Android ve la máquina anfitriona como 10.0.2.2; en un teléfono real
// hay que poner la IP de la PC (o definir EXPO_PUBLIC_API_URL en agrocontrol-mobile/.env).
export const URL_POR_DEFECTO =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080");

export type Sesion = Readonly<{
  token: string;
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: string;
  debeCambiarPassword: boolean;
}>;

export type DatosCampo = Readonly<{
  predios: readonly Predio[];
  parcelas: readonly Parcela[];
  cultivos: readonly Cultivo[];
  campanas: readonly Campana[];
  labores: readonly Labor[];
  cosechas: readonly Cosecha[];
  incidencias: readonly Incidencia[];
}>;

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const sinBarraFinal = (url: string) => url.trim().replace(/\/+$/, "");

async function pedir<T>(baseUrl: string, ruta: string, init: RequestInit = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${sinBarraFinal(baseUrl)}${ruta}`, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...init.headers },
    });
  } catch {
    throw new ErrorApi(`No se pudo conectar con ${sinBarraFinal(baseUrl)}. ¿Está encendido el backend?`, 0);
  }
  if (!respuesta.ok) {
    // El backend responde ProblemDetail: { detail: "..." }
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorApi(cuerpo?.detail ?? `Error ${respuesta.status}`, respuesta.status);
  }
  return respuesta.json() as Promise<T>;
}

export function iniciarSesion(baseUrl: string, email: string, password: string): Promise<Sesion> {
  return pedir<Sesion>(baseUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  });
}

// Formas tal como llegan del backend (BigDecimal puede ser null, fechas con hora, etc.)
type PredioApi = Omit<Predio, "ubicacion" | "areaHa"> & { ubicacion: string | null; areaHa: number | null };
type ParcelaApi = Omit<Parcela, "areaHa"> & { areaHa: number | null };
type CosechaApi = Cosecha & { anulado: boolean };
type IncidenciaApi = Incidencia;

// Trae todo lo que muestra la app en paralelo. Las cosechas no las ve el operario (403):
// en ese caso el historial sale sin rendimiento en vez de fallar toda la carga.
export async function cargarDatos(baseUrl: string, token: string): Promise<DatosCampo> {
  const get = <T,>(ruta: string) => pedir<T>(baseUrl, ruta, { headers: { Authorization: `Bearer ${token}` } });

  const [predios, parcelas, cultivos, campanas, labores, incidencias, cosechas] = await Promise.all([
    get<PredioApi[]>("/api/predios"),
    get<ParcelaApi[]>("/api/parcelas"),
    get<Cultivo[]>("/api/cultivos"),
    get<Campana[]>("/api/campanas"),
    get<Labor[]>("/api/labores"),
    get<IncidenciaApi[]>("/api/incidencias").catch(siProhibido([] as IncidenciaApi[])),
    get<CosechaApi[]>("/api/cosechas").catch(siProhibido([] as CosechaApi[])),
  ]);

  return {
    predios: predios.map((p) => ({ ...p, ubicacion: p.ubicacion ?? "Sin ubicación", areaHa: p.areaHa ?? 0 })),
    parcelas: parcelas.map((p) => ({ ...p, areaHa: p.areaHa ?? 0 })),
    cultivos,
    campanas,
    labores,
    incidencias: incidencias.map((i) => ({ ...i, fecha: i.fecha.slice(0, 10) })),
    cosechas: cosechas.filter((c) => !c.anulado),
  };
}

const siProhibido =
  <T,>(vacio: T) =>
  (error: unknown): T => {
    if (error instanceof ErrorApi && error.status === 403) return vacio;
    throw error;
  };
