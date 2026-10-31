import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LaborTable from '../components/LaborTable';
import type { EstadoLabor, Labor } from '../models/Labor';

const labor = (estado: EstadoLabor): Labor => ({
  id: 1, campanaId: 1, parcelaId: 1, tipo: 'RIEGO', fechaPlan: '2026-01-01', fechaEjecucion: null, estado, motivoCancelacion: null,
});

const nada = vi.fn();
const comun = { campanas: [], catalogos: { predios: [], parcelas: [], cultivos: [] }, onInsumos: nada, onBitacora: nada };
const jefe = { onEditar: nada, onAsignar: nada, onIniciar: nada, onEjecutar: nada, onCancelar: nada, onReabrir: nada };

function acciones(estado: EstadoLabor, permisos: Record<string, () => void>) {
  render(<LaborTable labores={[labor(estado)]} {...comun} {...permisos} />);
  return screen.queryAllByRole('button').map((boton) => boton.textContent);
}

describe('LaborTable', () => {
  it('cancelada no ofrece Ejecutar ni Asignar', () => {
    const botones = acciones('CANCELADA', jefe);
    expect(botones).not.toContain('Ejecutar');
    expect(botones).not.toContain('Asignar');
    expect(botones).not.toContain('Cancelar');
  });

  it('asignada se puede editar, iniciar y cancelar', () => {
    expect(acciones('ASIGNADA', jefe)).toEqual(expect.arrayContaining(['Editar', 'Iniciar', 'Cancelar']));
  });

  it('ejecutada ofrece Reabrir al jefe', () => {
    expect(acciones('EJECUTADA', jefe)).toContain('Reabrir');
  });

  it('ejecutada no ofrece Reabrir al operario', () => {
    expect(acciones('EJECUTADA', { onIniciar: nada, onEjecutar: nada })).not.toContain('Reabrir');
  });
});
