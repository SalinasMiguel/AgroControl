import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CampanaTable from '../components/CampanaTable';
import type { Campana, EstadoCampana } from '../models/Campana';

const campana = (estado: EstadoCampana): Campana => ({
  id: 1, parcelaId: 1, cultivoId: 1, fechaInicio: '2026-01-01', fechaFin: null, estado, motivoCierre: null,
  areaSembradaHa: null, variedad: null, fechaCosechaEstimada: null,
});

function acciones(estado: EstadoCampana) {
  const nada = vi.fn();
  render(
    <CampanaTable
      campanas={[campana(estado)]}
      catalogos={{ predios: [], parcelas: [], cultivos: [] }}
      onEditar={nada}
      onIniciar={nada}
      onCancelar={nada}
      onFinalizar={nada}
      onMarcarPerdida={nada}
      onReabrir={nada}
    />,
  );
  return screen.queryAllByRole('button').map((boton) => boton.textContent);
}

describe('CampanaTable', () => {
  it('planificada ofrece Editar, Iniciar y Cancelar', () => {
    expect(acciones('PLANIFICADA')).toEqual(['Editar', 'Iniciar', 'Cancelar']);
  });

  it('en curso ofrece Editar, Finalizar y Marcar perdida', () => {
    expect(acciones('EN_CURSO')).toEqual(['Editar', 'Finalizar', 'Marcar perdida']);
  });

  it.each<EstadoCampana>(['FINALIZADA', 'PERDIDA'])('%s ofrece Reabrir', (estado) => {
    expect(acciones(estado)).toEqual(['Reabrir']);
  });

  it('avisa si una campaña abierta pasó su cosecha estimada', () => {
    render(
      <CampanaTable
        campanas={[{ ...campana('EN_CURSO'), fechaCosechaEstimada: '2000-01-01', variedad: 'DK 7500' }]}
        catalogos={{ predios: [], parcelas: [], cultivos: [] }}
      />,
    );
    expect(screen.getByText('DK 7500')).toBeInTheDocument();
    expect(screen.getByText(/Atrasada/)).toBeInTheDocument();
  });

  it('cancelada no ofrece ninguna', () => {
    expect(acciones('CANCELADA')).toEqual([]);
  });
});
