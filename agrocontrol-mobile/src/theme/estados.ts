import { CircleHelp, Leaf, Moon, Shovel, Sprout, Tractor, Wheat, type LucideIcon } from "lucide-react-native";
import type { NombreEtapa } from "../logic/siembra";
import type { EstadoParcela } from "../models/agro";
import { PALETTE } from "./palette";

// Cómo se ve cada estado de parcela: un solo lugar para chip, barra y leyenda.
export const ESTADO_VISUAL: Record<
  EstadoParcela,
  Readonly<{ texto: string; icono: LucideIcon; color: string; fondo: string }>
> = {
  EN_PRODUCCION: { texto: "Sembrada", icono: Sprout, color: PALETTE.sembrada, fondo: PALETTE.sembradaSuave },
  DISPONIBLE: { texto: "Lista para sembrar", icono: Shovel, color: PALETTE.disponible, fondo: PALETTE.disponibleSuave },
  EN_DESCANSO: { texto: "En descanso", icono: Moon, color: PALETTE.descanso, fondo: PALETTE.descansoSuave },
};

// Un estado que esta versión de la app no conoce se muestra así, sin cerrar la app.
export const VISUAL_DESCONOCIDO = {
  texto: "Sin clasificar",
  icono: CircleHelp,
  color: PALETTE.textoSuave,
  fondo: PALETTE.superficie,
};

export function visualParcela(estado: string) {
  return ESTADO_VISUAL[estado as EstadoParcela] ?? VISUAL_DESCONOCIDO;
}

export const ETAPA_ICONO: Record<NombreEtapa, LucideIcon> = {
  Germinación: Sprout,
  Crecimiento: Leaf,
  Maduración: Wheat,
  "Lista para cosecha": Tractor,
};
