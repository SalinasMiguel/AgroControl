import type { Rol } from './models/Sesion';

// Misma matriz que SecurityConfig en el backend: el front oculta lo que el rol no puede hacer
// y el backend lo rechaza con 403 si alguien lo intenta igual.

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  JEFE_DE_CAMPO: 'Jefe de campo',
  OPERARIO: 'Operario',
  ALMACENERO: 'Almacenero',
  SUPERVISOR: 'Supervisor',
};

export type Seccion =
  | 'inicio' | 'predios' | 'parcelas' | 'cultivos' | 'campanas' | 'labores' | 'insumos' | 'cosechas' | 'incidencias' | 'usuarios' | 'auditoria';

const SECCIONES: Record<Rol, Seccion[]> = {
  ADMINISTRADOR: ['inicio', 'predios', 'parcelas', 'cultivos', 'campanas', 'labores', 'insumos', 'cosechas', 'incidencias', 'usuarios', 'auditoria'],
  JEFE_DE_CAMPO: ['inicio', 'predios', 'parcelas', 'cultivos', 'campanas', 'labores', 'insumos', 'cosechas', 'incidencias'],
  OPERARIO: ['inicio', 'labores', 'incidencias'],
  ALMACENERO: ['inicio', 'insumos', 'cosechas'],
  SUPERVISOR: ['inicio', 'predios', 'parcelas', 'cultivos', 'campanas', 'labores', 'insumos', 'cosechas', 'incidencias'],
};

export type Accion =
  | 'predios.editar'
  | 'parcelas.editar'
  | 'cultivos.crear'
  | 'campanas.gestionar'
  | 'labores.planificar'
  | 'labores.ejecutar'
  | 'insumos.gestionar'
  | 'insumos.verMovimientos'
  | 'cosechas.registrar'
  | 'consumos.anular'
  | 'incidencias.reportar'
  | 'bitacora.registrar'
  | 'incidencias.gestionar'
  | 'parcelas.verBitacora'
  | 'usuarios.gestionar';

const ACCIONES: Record<Accion, Rol[]> = {
  'predios.editar': ['ADMINISTRADOR'],
  'parcelas.editar': ['ADMINISTRADOR'],
  'cultivos.crear': ['ADMINISTRADOR', 'JEFE_DE_CAMPO'],
  'campanas.gestionar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO'],
  'labores.planificar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO'],
  'labores.ejecutar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO', 'OPERARIO'],
  'insumos.gestionar': ['ADMINISTRADOR', 'ALMACENERO'],
  'insumos.verMovimientos': ['ADMINISTRADOR', 'ALMACENERO', 'JEFE_DE_CAMPO', 'SUPERVISOR'],
  'cosechas.registrar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO', 'ALMACENERO'],
  'consumos.anular': ['ADMINISTRADOR', 'JEFE_DE_CAMPO'],
  // RF-12 y RF-09: las registran quienes están o supervisan el campo
  'incidencias.reportar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO', 'OPERARIO', 'SUPERVISOR'],
  'bitacora.registrar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO', 'OPERARIO', 'SUPERVISOR'],
  // Atender y cerrar incidencias: quien gestiona, no el operario que la reportó
  'incidencias.gestionar': ['ADMINISTRADOR', 'JEFE_DE_CAMPO', 'SUPERVISOR'],
  'parcelas.verBitacora': ['ADMINISTRADOR', 'JEFE_DE_CAMPO', 'SUPERVISOR'],
  'usuarios.gestionar': ['ADMINISTRADOR'],
};

export function puedeVer(rol: Rol, seccion: Seccion): boolean {
  return SECCIONES[rol].includes(seccion);
}

export function puede(rol: Rol, accion: Accion): boolean {
  return ACCIONES[accion].includes(rol);
}
