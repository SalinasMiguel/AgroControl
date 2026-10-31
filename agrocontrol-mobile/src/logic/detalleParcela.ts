import type { Campana, Cosecha, Cultivo, Incidencia, Labor, Parcela } from "../models/agro";

export const campanaAbierta = (c: Campana): boolean => c.estado === "PLANIFICADA" || c.estado === "EN_CURSO";

export type CampanaPasada = Readonly<{
  campana: Campana;
  cultivo: Cultivo | undefined;
  toneladas: number | null;
  rendimiento: number | null; // t/ha
}>;

export type DetalleParcela = Readonly<{
  campana: Campana | undefined; // en curso o planificada
  cultivo: Cultivo | undefined;
  labores: readonly Labor[]; // de la campaña actual, por fecha
  proximaLabor: Labor | undefined; // la primera que no está ejecutada
  incidencias: readonly Incidencia[]; // sin resolver primero
  historial: readonly CampanaPasada[]; // campañas cerradas, la más reciente primero
}>;

type Datos = Readonly<{
  campanas: readonly Campana[];
  cultivos: readonly Cultivo[];
  labores: readonly Labor[];
  cosechas: readonly Cosecha[];
  incidencias: readonly Incidencia[];
}>;

// Todo lo de una parcela se deriva de los datos: no se guarda aparte.
export function armarDetalle(parcela: Parcela, datos: Datos): DetalleParcela {
  const cultivoDe = (id: number) => datos.cultivos.find((c) => c.id === id);
  const campana = datos.campanas.find((c) => c.parcelaId === parcela.id && campanaAbierta(c));
  const labores = campana
    ? datos.labores.filter((l) => l.campanaId === campana.id && l.estado !== "CANCELADA").sort((a, b) => a.fechaPlan.localeCompare(b.fechaPlan))
    : [];

  const historial = datos.campanas
    .filter((c) => c.parcelaId === parcela.id && (c.estado === "FINALIZADA" || c.estado === "PERDIDA"))
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))
    .map((c) => {
      const cosechas = datos.cosechas.filter((k) => k.campanaId === c.id);
      const toneladas = cosechas.length
        ? cosechas.reduce((suma, k) => suma + (k.unidadMedida === "kg" ? k.cantidad / 1000 : k.cantidad), 0)
        : null;
      const rendimiento = toneladas !== null && parcela.areaHa > 0 ? toneladas / parcela.areaHa : null;
      return { campana: c, cultivo: cultivoDe(c.cultivoId), toneladas, rendimiento };
    });

  const incidencias = datos.incidencias
    .filter((i) => i.parcelaId === parcela.id && i.estado !== "ANULADA")
    .sort((a, b) => Number(a.estado === "RESUELTA") - Number(b.estado === "RESUELTA") || b.fecha.localeCompare(a.fecha));

  return {
    campana,
    cultivo: campana && cultivoDe(campana.cultivoId),
    labores,
    proximaLabor: labores.find((l) => l.estado !== "EJECUTADA"),
    incidencias,
    historial,
  };
}
