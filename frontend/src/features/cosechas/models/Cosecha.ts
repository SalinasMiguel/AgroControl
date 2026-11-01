export interface Cosecha {
  id: number;
  campanaId: number;
  cantidad: number;
  unidadMedida: string;
  toneladas: number;
  fecha: string;
  usuarioId: number;
  anulado: boolean;
  motivoAnulacion: string | null;
  anuladoPor: number | null;
  anuladoEn: string | null;
  humedadPct: number | null;
  impurezasPct: number | null;
  numeroBoleta: string | null;
}
