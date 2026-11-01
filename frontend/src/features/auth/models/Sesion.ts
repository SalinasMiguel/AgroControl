export type Rol = 'ADMINISTRADOR' | 'JEFE_DE_CAMPO' | 'OPERARIO' | 'ALMACENERO' | 'SUPERVISOR';

// Respuesta de POST /api/auth/login y GET /api/auth/me
export interface Sesion {
  token: string;
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: Rol;
  // Opcional: localStorage puede guardar sesiones de antes de este campo
  debeCambiarPassword?: boolean;
}
