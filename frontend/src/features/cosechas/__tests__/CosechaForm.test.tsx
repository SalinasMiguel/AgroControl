import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context/useAuth';
import CosechaForm from '../components/CosechaForm';
import type { Cosecha } from '../models/Cosecha';
import { cosechaService } from '../services/cosechaService';

vi.mock('../../../config/env', () => ({ API_URL: '/api' }));

const CAMPANA = { id: 7, parcelaId: 1, cultivoId: 1, fechaInicio: '2026-01-01', fechaFin: null, estado: 'EN_CURSO' as const, motivoCierre: null, areaSembradaHa: null, variedad: null, fechaCosechaEstimada: null, };

function montar() {
  const sesion = { nombreCompleto: 'Ana' } as AuthContextValue['sesion'];
  render(
    <AuthContext.Provider value={{ sesion } as AuthContextValue}>
      <CosechaForm campanas={[CAMPANA]} catalogos={{ predios: [], parcelas: [], cultivos: [] }} onCreated={() => {}} />
    </AuthContext.Provider>,
  );
}

describe('CosechaForm', () => {
  afterEach(() => vi.restoreAllMocks());

  async function completar(fecha: string) {
    await userEvent.selectOptions(screen.getByLabelText('Campaña'), '7');
    await userEvent.type(screen.getByLabelText('Cantidad'), '5');
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: fecha } });
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cosecha' }));
  }

  it('envía la fecha elegida', async () => {
    const registrar = vi.spyOn(cosechaService, 'registrar').mockResolvedValue({} as Cosecha);
    montar();

    await completar('2026-02-03');

    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ fecha: '2026-02-03' }));
  });

  it('no acepta fecha futura', async () => {
    const registrar = vi.spyOn(cosechaService, 'registrar').mockResolvedValue({} as Cosecha);
    montar();

    await completar('2999-01-01');

    expect(registrar).not.toHaveBeenCalled();
    expect(screen.getByText('La fecha no puede ser futura.')).toBeTruthy();
  });
});
