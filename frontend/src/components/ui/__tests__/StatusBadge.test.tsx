import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('muestra el estado legible y la clase de color que le corresponde', () => {
    render(<StatusBadge estado="EN_PRODUCCION" />);
    const badge = screen.getByText('EN PRODUCCION');
    expect(badge).toHaveClass('status-badge', 'status-progress');
  });

  it('usa el color neutro para un estado desconocido', () => {
    render(<StatusBadge estado="OTRO" />);
    expect(screen.getByText('OTRO')).toHaveClass('status-neutral');
  });

  it.each([
    ['CANCELADA', 'status-inactive'],
    ['PERDIDA', 'status-inactive'],
    ['ANULADA', 'status-neutral'],
    ['ASIGNADA', 'status-planned'],
  ])('colorea %s', (estado, clase) => {
    render(<StatusBadge estado={estado} />);
    expect(screen.getByText(estado)).toHaveClass(clase);
  });
});
