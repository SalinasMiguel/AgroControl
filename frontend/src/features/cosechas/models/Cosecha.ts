export interface Cosecha {
  id: number;
  campanaId: number;
  cantidad: number;
  unidadMedida: string;
  fecha: string;
  usuarioId: number;
  anulado: boolean;
  motivoAnulacion: string | null;
  anuladoPor: number | null;
  anuladoEn: string | null;
}
