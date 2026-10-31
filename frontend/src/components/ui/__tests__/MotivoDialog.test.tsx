import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import MotivoDialog from '../MotivoDialog';

const comun = { open: true, title: 'Anular', confirmLabel: 'Anular', onCancel: () => {} };

describe('MotivoDialog', () => {
  beforeAll(() => {
    // jsdom no implementa showModal
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  });

  it('exige motivo y limita a 200 caracteres', async () => {
    const onConfirm = vi.fn();
    render(<MotivoDialog {...comun} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Anular', hidden: true }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Indique el motivo.')).toBeTruthy();
    expect(screen.getByLabelText('Motivo')).toHaveAttribute('maxlength', '200');
  });

  it('muestra el error de la API y no se cierra', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Stock insuficiente'));
    render(<MotivoDialog {...comun} onCancel={onCancel} onConfirm={onConfirm} />);

    await userEvent.type(screen.getByLabelText('Motivo'), 'Error de carga');
    await userEvent.click(screen.getByRole('button', { name: 'Anular', hidden: true }));

    expect(await screen.findByText('Stock insuficiente')).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('con conFecha envía motivo y fecha', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<MotivoDialog {...comun} conFecha="Fecha de fin" onConfirm={onConfirm} />);

    await userEvent.type(screen.getByLabelText('Motivo'), 'Granizo');
    const fecha = screen.getByLabelText('Fecha de fin');
    await userEvent.clear(fecha);
    await userEvent.type(fecha, '2026-10-30');
    await userEvent.click(screen.getByRole('button', { name: 'Anular', hidden: true }));

    expect(onConfirm).toHaveBeenCalledWith('Granizo', '2026-10-30');
  });

  it('muestra el aviso', () => {
    render(<MotivoDialog {...comun} aviso="Los insumos no vuelven" onConfirm={vi.fn()} />);

    expect(screen.getByText('Los insumos no vuelven')).toBeTruthy();
  });
});
