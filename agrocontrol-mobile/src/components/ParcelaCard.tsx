import { StyleSheet, Text, View } from "react-native";
import type { Campana, Cultivo, Parcela } from "../models/agro";
import { PALETTE } from "../theme/palette";
import { ESTADO_VISUAL } from "../theme/estados";
import { CampanaProgreso } from "./CampanaProgreso";
import { EstadoChip } from "./EstadoChip";

type Props = {
  parcela: Parcela;
  nombrePredio: string;
  campana?: Campana; // campaña en curso o planificada, si la hay
  cultivo?: Cultivo;
};

export function ParcelaCard({ parcela, nombrePredio, campana, cultivo }: Props) {
  const visual = ESTADO_VISUAL[parcela.estado];
  return (
    <View style={[styles.tarjeta, { borderLeftColor: visual.color }]}>
      <View style={styles.cabecera}>
        <Text style={styles.codigo}>
          {parcela.codigo} <Text style={styles.id}>#{parcela.id}</Text>
        </Text>
        <EstadoChip estado={parcela.estado} />
      </View>
      <Text style={styles.detalle}>
        {parcela.areaHa} ha · Predio: <Text style={styles.predio}>{nombrePredio}</Text>
      </Text>
      {campana && cultivo && <CampanaProgreso campana={campana} cultivo={cultivo} />}
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
    gap: 4,
  },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  codigo: { fontSize: 16, fontWeight: "700", color: PALETTE.texto },
  id: { fontSize: 13, fontWeight: "400", color: PALETTE.textoSuave },
  detalle: { fontSize: 14, color: PALETTE.textoSuave },
  predio: { color: PALETTE.acento, fontWeight: "600" },
});
