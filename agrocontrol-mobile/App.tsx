import { useCallback, useEffect, useState } from "react";
import { BackHandler, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import type { Parcela, Seccion } from "./src/models/agro";
import { DATOS_DEMO } from "./src/data/demoData";
import { cargarDatos, iniciarSesion, URL_POR_DEFECTO, type DatosCampo, type Sesion } from "./src/api/cliente";
import { armarDetalle, campanaAbierta } from "./src/logic/detalleParcela";
import { PALETTE } from "./src/theme/palette";
import { MetricCard } from "./src/components/MetricCard";
import { TabSelector } from "./src/components/TabSelector";
import { PredioCard } from "./src/components/PredioCard";
import { ParcelaCard } from "./src/components/ParcelaCard";
import { EmptyState } from "./src/components/EmptyState";
import { ResumenCampo } from "./src/components/ResumenCampo";
import { PredioDetalle } from "./src/components/PredioDetalle";
import { LoginPantalla } from "./src/components/LoginPantalla";

export default function App() {
  // Qué sección se ve y qué predio está elegido.
  const [seccion, setSeccion] = useState<Seccion>("predios");
  const [predioId, setPredioId] = useState<number | null>(null);

  // Conexión: sin datos se muestra el login; sesion === null con datos = modo demostración.
  const [servidor, setServidor] = useState(URL_POR_DEFECTO);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [datos, setDatos] = useState<DatosCampo | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async (url: string, email: string, password: string) => {
    setCargando(true);
    setError(null);
    try {
      const nueva = await iniciarSesion(url, email, password);
      if (nueva.debeCambiarPassword) {
        setError("Cambie su contraseña en la web antes de usar la app");
        return;
      }
      setDatos(await cargarDatos(url, nueva.token));
      setServidor(url);
      setSesion(nueva);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  const recargar = useCallback(async () => {
    if (!sesion) return;
    setCargando(true);
    try {
      setDatos(await cargarDatos(servidor, sesion.token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron actualizar los datos");
    } finally {
      setCargando(false);
    }
  }, [servidor, sesion]);

  const salir = () => {
    setSesion(null);
    setDatos(null);
    setPredioId(null);
    setError(null);
  };

  const { predios: PREDIOS, parcelas: PARCELAS, cultivos: CULTIVOS, campanas: CAMPANAS } = datos ?? DATOS_DEMO;

  // Estado derivado: se recalcula en cada render, no se guarda.
  const predioElegido = PREDIOS.find((p) => p.id === predioId) ?? null;
  const parcelasElegidas = predioElegido
    ? PARCELAS.filter((p) => p.predioId === predioElegido.id)
    : [];

  // Con un predio abierto, el botón "atrás" de Android vuelve a la lista en vez de cerrar la app.
  useEffect(() => {
    if (predioId === null) return;
    const suscripcion = BackHandler.addEventListener("hardwareBackPress", () => {
      setPredioId(null);
      return true;
    });
    return () => suscripcion.remove();
  }, [predioId]);

  const contarParcelas = (id: number) => PARCELAS.filter((p) => p.predioId === id).length;
  const nombreDePredio = (id: number) =>
    PREDIOS.find((p) => p.id === id)?.nombre ?? "Predio desconocido";
  const sembradas = PARCELAS.filter((p) => p.estado === "SEMBRADA").length;

  // Campaña no finalizada de la parcela, con su cultivo (si existe).
  const siembraDe = (parcelaId: number) => {
    const campana = CAMPANAS.find((c) => c.parcelaId === parcelaId && campanaAbierta(c));
    const cultivo = campana && CULTIVOS.find((c) => c.id === campana.cultivoId);
    return { campana, cultivo };
  };

  const detalleDe = (parcela: Parcela) =>
    armarDetalle(parcela, {
      ...(datos ?? DATOS_DEMO),
    });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.pantalla} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        {/* key: al abrir o cerrar un predio el scroll vuelve arriba */}
        <ScrollView
          key={predioId ?? "inicio"}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          refreshControl={sesion ? <RefreshControl refreshing={cargando} onRefresh={recargar} /> : undefined}
        >
          {!datos ? (
            <LoginPantalla
              urlInicial={servidor}
              cargando={cargando}
              error={error}
              alEntrar={entrar}
              alVerDemo={() => setDatos(DATOS_DEMO)}
            />
          ) : predioElegido ? (
            <PredioDetalle
              predio={predioElegido}
              parcelas={parcelasElegidas}
              detalleDe={detalleDe}
              alVolver={() => setPredioId(null)}
            />
          ) : (
            <>
            <Text style={styles.titulo}>AgroControl</Text>
            <Text style={styles.subtitulo}>Gestión de predios, parcelas y siembras</Text>

            <View style={styles.sesion}>
              <Text style={styles.sesionTexto} numberOfLines={1}>
                {sesion ? `${sesion.nombreCompleto} · ${sesion.rol.replaceAll("_", " ")}` : "Modo demostración (datos ficticios)"}
              </Text>
              <Pressable onPress={salir} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.salir}>{sesion ? "Salir" : "Iniciar sesión"}</Text>
              </Pressable>
            </View>
            {sesion && error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.fila}>
              <MetricCard etiqueta="Predios" valor={PREDIOS.length} />
              <MetricCard etiqueta="Parcelas" valor={PARCELAS.length} />
              <MetricCard etiqueta="Sembradas" valor={sembradas} />
            </View>

            <ResumenCampo parcelas={PARCELAS} />

            <TabSelector seccion={seccion} alCambiar={setSeccion} />

            {seccion === "predios" ? (
              <View style={styles.lista}>
                <Text style={styles.seccionTitulo}>Predios</Text>
                {PREDIOS.map((predio) => (
                  <PredioCard
                    key={predio.id}
                    predio={predio}
                    cantidadParcelas={contarParcelas(predio.id)}
                    seleccionado={predioId === predio.id}
                    alSeleccionar={setPredioId}
                  />
                ))}

                <Text style={styles.ayuda}>Toque un predio para ver sus parcelas y el estado de cada una.</Text>
              </View>
            ) : (
              <View style={styles.lista}>
                <Text style={styles.seccionTitulo}>Todas las parcelas</Text>
                {PARCELAS.map((parcela) => (
                  <ParcelaCard
                    key={parcela.id}
                    parcela={parcela}
                    nombrePredio={nombreDePredio(parcela.predioId)}
                    {...siembraDe(parcela.id)}
                  />
                ))}
              </View>
            )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: PALETTE.fondo },
  contenido: { padding: 20, gap: 16 },
  titulo: { fontSize: 28, fontWeight: "700", color: PALETTE.texto },
  subtitulo: { fontSize: 15, color: PALETTE.textoSuave },
  fila: { flexDirection: "row", gap: 12 },
  lista: { gap: 10 },
  seccionTitulo: { fontSize: 18, fontWeight: "700", color: PALETTE.texto, marginTop: 4 },
  sesion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: PALETTE.acentoSuave,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sesionTexto: { flex: 1, fontSize: 14, color: PALETTE.texto },
  salir: { fontSize: 14, fontWeight: "700", color: PALETTE.acento },
  error: { color: PALETTE.inactivo, backgroundColor: PALETTE.inactivoSuave, padding: 10, borderRadius: 8 },
  ayuda: { fontSize: 14, color: PALETTE.textoSuave, textAlign: "center" },
});
