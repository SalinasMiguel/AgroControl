import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../context/useAuth';
import LoginPage from '../pages/LoginPage';
import { authService } from '../services/authService';

vi.mock('../../../config/env', () => ({ API_URL: '/api' }));

function montar() {
  render(
    <AuthContext.Provider value={{ sesion: null } as AuthContextValue}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('LoginPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra los usuarios de prueba solo si health.demo es true', async () => {
    vi.spyOn(authService, 'demo').mockResolvedValue(true);
    montar();
    expect(screen.queryByText(/Usuarios de prueba/)).toBeNull();
    await waitFor(() => expect(screen.getByText(/Usuarios de prueba/)).toBeTruthy());
  });

  it('oculta los usuarios de prueba si health falla', async () => {
    const demo = vi.spyOn(authService, 'demo').mockRejectedValue(new Error('sin red'));
    montar();
    await waitFor(() => expect(demo).toHaveBeenCalled());
    await new Promise((resolver) => setTimeout(resolver));
    expect(screen.queryByText(/Usuarios de prueba/)).toBeNull();
  });
});
