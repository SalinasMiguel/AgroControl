import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ClaveTemporalDialog from '../components/ClaveTemporalDialog';

describe('ClaveTemporalDialog', () => {
  beforeAll(() => {
    // jsdom no implementa showModal
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it('muestra la clave una sola vez y avisa que no se volverá a ver', () => {
    const { rerender } = render(<ClaveTemporalDialog clave="Abcdefgh2345" nombre="Ana Vaca" onCerrar={() => {}} />);

    expect(screen.getByText('Abcdefgh2345')).toBeTruthy();
    expect(screen.getByText(/no se volverá a mostrar/i)).toBeTruthy();

    rerender(<ClaveTemporalDialog clave={null} nombre="Ana Vaca" onCerrar={() => {}} />);
    expect(screen.queryByText('Abcdefgh2345')).toBeNull();
  });
});
