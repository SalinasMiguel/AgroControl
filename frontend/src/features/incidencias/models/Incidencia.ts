export type EstadoIncidencia = 'ABIERTA' | 'EN_ATENCION' | 'RESUELTA' | 'ANULADA';

export type TipoIncidencia = 'PLAGA' | 'ENFERMEDAD' | 'MALEZA' | 'CLIMA' | 'MAQUINARIA' | 'RIEGO' | 'OTRO';
export type GravedadIncidencia = 'BAJA' | 'MEDIA' | 'ALTA';

export const TIPOS_INCIDENCIA: { valor: TipoIncidencia; nombre: string }[] = [
  { valor: 'PLAGA', nombre: 'Plaga' },
  { valor: 'ENFERMEDAD', nombre: 'Enfermedad' },
  { valor: 'MALEZA', nombre: 'Maleza' },
  { valor: 'CLIMA', nombre: 'Clima' },
  { valor: 'MAQUINARIA', nombre: 'Maquinaria' },
  { valor: 'RIEGO', nombre: 'Riego' },
  { valor: 'OTRO', nombre: 'Otro' },
];

export const nombreTipoIncidencia = (tipo: TipoIncidencia) =>
  TIPOS_INCIDENCIA.find((item) => item.valor === tipo)?.nombre ?? tipo;

export interface Incidencia {
  id: number;
  parcelaId: number | null;
  campanaId: number | null;
  laborId: number | null;
  descripcion: string;
  usuarioId: number;
  fecha: string;
  estado: EstadoIncidencia;
  resolucion: string | null;
  resueltaEn: string | null;
  motivoAnulacion: string | null;
  anuladoPor: number | null;
  anuladoEn: string | null;
  tipo: TipoIncidencia;
  gravedad: GravedadIncidencia;
  responsableId: number | null;
}

export interface FotoIncidencia {
  id: number;
  incidenciaId: number;
  tipoContenido: string;
  tamano: number;
  usuarioId: number;
  fecha: string;
}
