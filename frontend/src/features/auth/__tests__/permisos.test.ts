import { describe, expect, it } from 'vitest';
import { puede, puedeVer } from '../permisos';

// La matriz debe coincidir con SecurityConfig: si la web muestra un botón que el backend rechaza,
// el usuario ve un 403 en vez de no ver el botón.
describe('permisos por rol', () => {
  it('el operario solo ve su agenda e incidencias', () => {
    expect(puedeVer('OPERARIO', 'labores')).toBe(true);
    expect(puedeVer('OPERARIO', 'incidencias')).toBe(true);
    expect(puedeVer('OPERARIO', 'insumos')).toBe(false);
    expect(puedeVer('OPERARIO', 'usuarios')).toBe(false);
  });

  it('solo el administrador gestiona usuarios y edita predios', () => {
    expect(puede('ADMINISTRADOR', 'usuarios.gestionar')).toBe(true);
    expect(puede('JEFE_DE_CAMPO', 'usuarios.gestionar')).toBe(false);
    expect(puede('JEFE_DE_CAMPO', 'predios.editar')).toBe(false);
  });

  it('el supervisor registra incidencias y observaciones de campo (RF-12, RF-09)', () => {
    expect(puede('SUPERVISOR', 'incidencias.reportar')).toBe(true);
    expect(puede('SUPERVISOR', 'bitacora.registrar')).toBe(true);
    expect(puede('ALMACENERO', 'bitacora.registrar')).toBe(false);
  });

  it('el operario reporta incidencias pero no las cierra', () => {
    expect(puede('OPERARIO', 'incidencias.reportar')).toBe(true);
    expect(puede('OPERARIO', 'incidencias.gestionar')).toBe(false);
    expect(puede('JEFE_DE_CAMPO', 'incidencias.gestionar')).toBe(true);
  });

  it('solo el administrador ve la auditoría', () => {
    expect(puedeVer('ADMINISTRADOR', 'auditoria')).toBe(true);
    expect(puedeVer('SUPERVISOR', 'auditoria')).toBe(false);
  });

  it('el almacenero mueve stock y registra cosechas', () => {
    expect(puede('ALMACENERO', 'insumos.gestionar')).toBe(true);
    expect(puede('ALMACENERO', 'cosechas.registrar')).toBe(true);
    expect(puede('ALMACENERO', 'labores.planificar')).toBe(false);
  });

  it('anular consumos es del administrador y del jefe de campo', () => {
    expect(puede('JEFE_DE_CAMPO', 'consumos.anular')).toBe(true);
    expect(puede('ALMACENERO', 'consumos.anular')).toBe(false);
    expect(puede('OPERARIO', 'consumos.anular')).toBe(false);
  });
});
