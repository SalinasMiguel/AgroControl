import { StyleSheet, Text, View } from "react-native";
import { visualParcela } from "../theme/estados";

type Props = {
  estado: string;
};

export function EstadoChip({ estado }: Props) {
  const { texto, icono: Icono, color, fondo } = visualParcela(estado);
  return (
    <View style={[styles.chip, { backgroundColor: fondo }]}>
      <Icono size={14} color={color} />
      <Text style={[styles.texto, { color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  texto: { fontSize: 12, fontWeight: "700" },
});
