import { StyleSheet, Text, View } from "react-native";
import type { EstadoParcela, Parcela } from "../models/agro";
import { PALETTE } from "../theme/palette";
import { ESTADO_VISUAL } from "../theme/estados";

type Props = {
  parcelas: readonly Parcela[];
};

const ORDEN: EstadoParcela[] = ["EN_PRODUCCION", "DISPONIBLE", "EN_DESCANSO"];

// Barra apilada: cuántas hectáreas hay en cada estado.
export function ResumenCampo({ parcelas }: Props) {
  const total = parcelas.reduce((suma, p) => suma + p.areaHa, 0);
  const hectareas = (estado: EstadoParcela) =>
    parcelas.filter((p) => p.estado === estado).reduce((suma, p) => suma + p.areaHa, 0);

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.titulo}>Estado del campo · {total} ha</Text>
      <View style={styles.barra}>
        {ORDEN.map((estado) => {
          const ha = hectareas(estado);
          return ha > 0 ? (
            <View key={estado} style={{ flex: ha, backgroundColor: ESTADO_VISUAL[estado].color }} />
          ) : null;
        })}
      </View>
      {ORDEN.map((estado) => {
        const ha = hectareas(estado);
        const visual = ESTADO_VISUAL[estado];
        return (
          <View key={estado} style={styles.leyenda}>
            <visual.icono size={16} color={visual.color} />
            <Text style={styles.leyendaTexto}>{visual.texto}</Text>
            <Text style={styles.leyendaValor}>
              {ha} ha · {total ? Math.round((ha / total) * 100) : 0}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: PALETTE.superficie, borderRadius: 12, padding: 16, gap: 8 },
  titulo: { fontSize: 16, fontWeight: "700", color: PALETTE.texto },
  barra: { flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden", gap: 2 },
  leyenda: { flexDirection: "row", alignItems: "center", gap: 8 },
  leyendaTexto: { flex: 1, fontSize: 14, color: PALETTE.texto },
  leyendaValor: { fontSize: 14, fontWeight: "600", color: PALETTE.textoSuave },
});
