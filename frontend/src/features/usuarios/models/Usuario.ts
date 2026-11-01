export interface Usuario {
  id: number;
  nombreCompleto: string;
  email: string;
  rolId: number;
  estado: 'ACTIVO' | 'INACTIVO';
  creadoEn: string;
  debeCambiarPassword?: boolean;
}
