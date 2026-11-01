import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ParcelaForm from '../components/ParcelaForm';
import type { Parcela } from '../models/Parcela';
import { parcelaService } from '../services/parcelaService';

vi.mock('../../../config/env', () => ({ API_URL: '/api' }));

const parcela = (estado: Parcela['estado']): Parcela => ({ id: 1, predioId: 1, codigo: 'P-01', areaHa: 5, estado });
const predios = [{ id: 1, nombre: 'Fundo', activo: true }] as never[];

describe('ParcelaForm', () => {
  afterEach(() => vi.restoreAllMocks());

  it('en producción se muestra fijo y envía el mismo estado', async () => {
    const actualizar = vi.spyOn(parcelaService, 'actualizar').mockResolvedValue(parcela('EN_PRODUCCION'));
    render(<ParcelaForm predios={predios} parcela={parcela('EN_PRODUCCION')} />);

    expect(screen.queryByRole('combobox', { name: 'Estado' })).toBeNull();
    expect(screen.getByDisplayValue('En producción')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(actualizar).toHaveBeenCalledWith(1, expect.objectContaining({ estado: 'EN_PRODUCCION' }));
  });

  it('disponible ofrece solo Disponible y En descanso', () => {
    render(<ParcelaForm predios={predios} parcela={parcela('DISPONIBLE')} />);

    const opciones = screen.getAllByRole('option').map((o) => o.textContent);
    expect(opciones).toContain('DISPONIBLE');
    expect(opciones).toContain('EN DESCANSO');
    expect(opciones).not.toContain('EN PRODUCCION');
  });
});
