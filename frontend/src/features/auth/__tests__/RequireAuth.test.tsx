import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from '../context/useAuth';
import { RequireAuth } from '../components/RequireAuth';
import type { Sesion } from '../models/Sesion';

const SESION: Sesion = {
  token: 't',
  usuarioId: 1,
  nombreCompleto: 'Ana',
  email: 'ana@agrocontrol.com',
  rol: 'OPERARIO',
};

function montar(sesion: Sesion, ruta = '/') {
  const contexto = { sesion } as AuthContextValue;
  render(
    <AuthContext.Provider value={contexto}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route index element={<p>Inicio</p>} />
            <Route path="cambiar-password" element={<p>Cambiar clave</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('lleva a /cambiar-password si la clave está pendiente', () => {
    montar({ ...SESION, debeCambiarPassword: true });
    expect(screen.getByText('Cambiar clave')).toBeTruthy();
  });

  it('una sesión antigua sin el campo entra normal', () => {
    montar(SESION);
    expect(screen.getByText('Inicio')).toBeTruthy();
  });

  it('no redirige en bucle dentro de /cambiar-password', () => {
    montar({ ...SESION, debeCambiarPassword: true }, '/cambiar-password');
    expect(screen.getByText('Cambiar clave')).toBeTruthy();
  });
});
