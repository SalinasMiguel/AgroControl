import { expect, it } from 'vitest';
import { diasDeSemana, moverSemanas } from '../semana';

it('la semana va de lunes a domingo aunque la fecha sea domingo', () => {
  // 2026-11-01 es domingo
  const dias = diasDeSemana('2026-11-01');
  expect(dias[0]).toBe('2026-10-26');
  expect(dias[6]).toBe('2026-11-01');
});

it('mueve semanas cruzando el mes', () => {
  expect(moverSemanas('2026-10-30', 1)).toBe('2026-11-06');
});
