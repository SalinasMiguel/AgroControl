import {
  Calendar,
  CircleCheck,
  Hourglass,
  TriangleAlert,
  Wheat,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { EstadoIncidencia, EstadoLabor, Parcela } from "../models/agro";
import type { DetalleParcela } from "../logic/detalleParcela";
import { formatearFechaIso } from "../logic/siembra";
import { PALETTE } from "../theme/palette";
import { ESTADO_VISUAL } from "../theme/estados";
import { CampanaProgreso } from "./CampanaProgreso";
import { EstadoChip } from "./EstadoChip";

type Props = {
  parcela: Parcela;
  areaPredio: number;
  detalle: DetalleParcela;
};

type VisualFila = { icono: LucideIcon; color: string; texto: string };

const LABOR_VISUAL: Record<EstadoLabor, VisualFila> = {
  EJECUTADA: { icono: CircleCheck, color: PALETTE.acento, texto: "Hecha" },
  EN_CURSO: { icono: Hourglass, color: PALETTE.disponible, texto: "En curso" },
  PLANIFICADA: { icono: Calendar, color: PALETTE.textoSuave, texto: "Pendiente" },
};

const INCIDENCIA_VISUAL: Record<EstadoIncidencia, VisualFila> = {
  ABIERTA: { icono: TriangleAlert, color: PALETTE.inactivo, texto: "Sin atender" },
  EN_ATENCION: { icono: Wrench, color: PALETTE.disponible, texto: "En atención" },
  RESUELTA: { icono: CircleCheck, color: PALETTE.textoSuave, texto: "Resuelta" },
};

const SIN_SIEMBRA: Record<Parcela["estado"], string> = {
  SEMBRADA: "Sembrada, sin campaña cargada.",
  DISPONIBLE: "Libre: lista para planificar una siembra.",
  EN_DESCANSO: "En descanso: el suelo se recupera esta temporada.",
};

// Los tipos llegan como código (FUMIGACION); en pantalla van con tilde
const NOMBRE_LABOR: Record<string, string> = {
  SIEMBRA: "Siembra",
  FERTILIZACION: "Fertilización",
  FUMIGACION: "Fumigación",
  RIEGO: "Riego",
  CONTROL_MALEZAS: "Control de malezas",
  COSECHA: "Cosecha",
};
const nombreLabor = (tipo: string) =>
  NOMBRE_LABOR[tipo] ?? tipo.charAt(0) + tipo.slice(1).toLowerCase().replace(/_/g, " ");
const decimal = (valor: number) => valor.toLocaleString("es-BO", { maximumFractionDigits: 1 });

// Todo lo que pasa en una parcela, en una sola tarjeta: qué tiene sembrado, qué trabajo
// falta, qué problemas hay y cómo le fue en las campañas anteriores.
export function ParcelaDetalle({ parcela, areaPredio, detalle }: Props) {
  const visual = ESTADO_VISUAL[parcela.estado];
  const { campana, cultivo, labores, proximaLabor, incidencias, historial } = detalle;
  const sinResolver = incidencias.filter((i) => i.estado !== "RESUELTA").length;
  const hechas = labores.filter((l) => l.estado === "EJECUTADA").length;

  return (
    <View style={[styles.tarjeta, { borderLeftColor: visual.color }]}>
      <View style={styles.cabecera}>
        <Text style={styles.codigo}>
          {parcela.codigo} <Text style={styles.id}>#{parcela.id}</Text>
        </Text>
        <EstadoChip estado={parcela.estado} />
      </View>
      <Text style={styles.detalle}>
        {parcela.areaHa} ha{areaPredio > 0 ? ` · ${Math.round((parcela.areaHa / areaPredio) * 100)}% del predio` : ""}
      </Text>
      {sinResolver > 0 && (
        <View style={styles.fila}>
          <TriangleAlert size={16} color={PALETTE.inactivo} />
          <Text style={styles.alerta}>{sinResolver} problema(s) sin resolver</Text>
        </View>
      )}

      <Text style={styles.seccion}>Siembra actual</Text>
      {campana && cultivo ? (
        <CampanaProgreso campana={campana} cultivo={cultivo} />
      ) : (
        <Text style={styles.vacio}>{SIN_SIEMBRA[parcela.estado]}</Text>
      )}

      {labores.length > 0 && (
        <>
          <Text style={styles.seccion}>
            Labores · {hechas} de {labores.length} hechas
          </Text>
          {proximaLabor && (
            <Text style={styles.proxima}>
              Próxima: {nombreLabor(proximaLabor.tipo)} el {formatearFechaIso(proximaLabor.fechaPlan)}
            </Text>
          )}
          {labores.map((labor) => {
            const v = LABOR_VISUAL[labor.estado];
            return (
              <View key={labor.id} style={styles.fila} accessible accessibilityLabel={`${labor.tipo}: ${v.texto}`}>
                <v.icono size={16} color={v.color} />
                <Text style={styles.filaTexto}>{nombreLabor(labor.tipo)}</Text>
                <Text style={styles.filaFecha}>
                  {formatearFechaIso(labor.fechaEjecucion ?? labor.fechaPlan)} · {v.texto}
                </Text>
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.seccion}>Incidencias</Text>
      {incidencias.length === 0 ? (
        <Text style={styles.vacio}>Sin problemas reportados.</Text>
      ) : (
        incidencias.map((incidencia) => {
          const v = INCIDENCIA_VISUAL[incidencia.estado];
          return (
            <View key={incidencia.id} style={styles.fila}>
              <v.icono size={16} color={v.color} />
              <Text style={[styles.filaTexto, incidencia.estado === "RESUELTA" && styles.resuelta]}>
                {incidencia.descripcion}
              </Text>
              <Text style={styles.filaFecha}>{v.texto}</Text>
            </View>
          );
        })
      )}

      <Text style={styles.seccion}>Campañas anteriores</Text>
      {historial.length === 0 ? (
        <Text style={styles.vacio}>Sin campañas anteriores.</Text>
      ) : (
        historial.map(({ campana: pasada, cultivo: cultivoPasado, toneladas, rendimiento }) => (
          <View key={pasada.id} style={styles.fila}>
            <Wheat size={16} color={PALETTE.textoSuave} />
            <Text style={styles.filaTexto}>
              {cultivoPasado?.nombre ?? "Cultivo"} · {formatearFechaIso(pasada.fechaInicio)}
              {pasada.fechaFin ? ` → ${formatearFechaIso(pasada.fechaFin)}` : ""}
            </Text>
            <Text style={styles.filaFecha}>
              {toneladas === null ? "Sin cosecha" : `${decimal(toneladas)} t${rendimiento === null ? "" : ` · ${decimal(rendimiento)} t/ha`}`}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: PALETTE.superficie,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: PALETTE.borde,
    padding: 14,
    gap: 6,
  },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  codigo: { fontSize: 18, fontWeight: "700", color: PALETTE.texto },
  id: { fontSize: 13, fontWeight: "400", color: PALETTE.textoSuave },
  detalle: { fontSize: 14, color: PALETTE.textoSuave },
  alerta: { flex: 1, fontSize: 14, fontWeight: "600", color: PALETTE.inactivo },
  seccion: {
    fontSize: 13,
    fontWeight: "700",
    color: PALETTE.acento,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  vacio: { fontSize: 14, color: PALETTE.textoSuave, fontStyle: "italic" },
  proxima: { fontSize: 14, fontWeight: "600", color: PALETTE.texto },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  filaTexto: { flex: 1, fontSize: 14, color: PALETTE.texto },
  filaFecha: { fontSize: 12, color: PALETTE.textoSuave, textAlign: "right" },
  resuelta: { color: PALETTE.textoSuave, textDecorationLine: "line-through" },
});
