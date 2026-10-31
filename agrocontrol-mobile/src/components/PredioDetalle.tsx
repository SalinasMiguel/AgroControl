import { MapPin } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Parcela, Predio } from "../models/agro";
import type { DetalleParcela } from "../logic/detalleParcela";
import { PALETTE } from "../theme/palette";
import { EmptyState } from "./EmptyState";
import { MetricCard } from "./MetricCard";
import { ParcelaDetalle } from "./ParcelaDetalle";
import { ResumenCampo } from "./ResumenCampo";

type Props = {
  predio: Predio;
  parcelas: readonly Parcela[];
  detalleDe: (parcela: Parcela) => DetalleParcela;
  alVolver: () => void;
};

// Pantalla de un predio: sus datos, cómo está repartido el campo y la ficha completa de cada parcela.
export function PredioDetalle({ predio, parcelas, detalleDe, alVolver }: Props) {
  const areaParcelas = parcelas.reduce((suma, p) => suma + p.areaHa, 0);
  const detalles = parcelas.map((parcela) => ({ parcela, detalle: detalleDe(parcela) }));
  const problemas = detalles.reduce(
    (suma, { detalle }) => suma + detalle.incidencias.filter((i) => i.estado === "ABIERTA" || i.estado === "EN_ATENCION").length,
    0,
  );

  return (
    <View style={styles.contenedor}>
      <Pressable accessibilityRole="button" onPress={alVolver} style={styles.volver} hitSlop={10}>
        <Text style={styles.volverTexto}>‹ Volver a predios</Text>
      </Pressable>

      <View style={styles.cabecera}>
        <Text style={styles.nombre}>{predio.nombre}</Text>
        <Text style={[styles.estado, !predio.activo && styles.estadoInactivo]}>
          {predio.activo ? "ACTIVO" : "INACTIVO"}
        </Text>
      </View>
      <View style={styles.ubicacion}>
        <MapPin size={16} color={PALETTE.textoSuave} />
        <Text style={styles.detalle}>
          {predio.ubicacion} · {predio.areaHa} ha en total · {areaParcelas} ha en parcelas
        </Text>
      </View>
      {!predio.activo && (
        <Text style={styles.aviso}>Predio inactivo: no se planifican campañas nuevas aquí.</Text>
      )}

      <View style={styles.fila}>
        <MetricCard etiqueta="Parcelas" valor={parcelas.length} />
        <MetricCard etiqueta="Sembradas" valor={parcelas.filter((p) => p.estado === "SEMBRADA").length} />
        <MetricCard etiqueta="Problemas" valor={problemas} />
      </View>

      {parcelas.length === 0 ? (
        <EmptyState mensaje="Este predio todavía no tiene parcelas." />
      ) : (
        <>
          <ResumenCampo parcelas={parcelas} />
          <Text style={styles.seccionTitulo}>Parcelas</Text>
          {detalles.map(({ parcela, detalle }) => (
            <ParcelaDetalle key={parcela.id} parcela={parcela} areaPredio={predio.areaHa} detalle={detalle} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 14 },
  volver: { alignSelf: "flex-start", paddingVertical: 4 },
  volverTexto: { fontSize: 16, fontWeight: "600", color: PALETTE.acento },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nombre: { fontSize: 26, fontWeight: "700", color: PALETTE.texto, flexShrink: 1 },
  estado: {
    fontSize: 12,
    fontWeight: "700",
    color: PALETTE.acento,
    backgroundColor: PALETTE.acentoSuave,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  estadoInactivo: { color: PALETTE.inactivo, backgroundColor: PALETTE.inactivoSuave },
  ubicacion: { flexDirection: "row", alignItems: "center", gap: 6 },
  detalle: { flex: 1, fontSize: 15, color: PALETTE.textoSuave },
  aviso: {
    fontSize: 14,
    color: PALETTE.inactivo,
    backgroundColor: PALETTE.inactivoSuave,
    padding: 10,
    borderRadius: 8,
  },
  fila: { flexDirection: "row", gap: 12 },
  seccionTitulo: { fontSize: 18, fontWeight: "700", color: PALETTE.texto, marginTop: 4 },
});
