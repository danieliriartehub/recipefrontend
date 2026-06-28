import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from './ResetPassword';
import { MemoryRouter } from 'react-router-dom';
import * as authLib from '@/lib/auth';
import { backendApi } from '@/lib/backendApi';
import React from 'react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock backendApi
vi.mock('@/lib/backendApi', () => ({
  backendApi: {
    post: vi.fn(),
  },
}));

// Suppress toast output and console warnings during tests
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ResetPassword Page', () => {
  const mockClearRecoveryToken = vi.fn();

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default useAuth mock
    vi.spyOn(authLib, 'useAuth').mockReturnValue({
      recoveryToken: 'valid-token',
      clearRecoveryToken: mockClearRecoveryToken,
      loading: false,
    } as any);
  });

  it('shows loading state while auth is initializing', () => {
    vi.spyOn(authLib, 'useAuth').mockReturnValue({
      loading: true,
    } as any);

    renderWithRouter(<ResetPassword />);
    expect(screen.getByText(/verificando link/i)).toBeInTheDocument();
  });

  it('shows invalid link screen if no token is available', () => {
    vi.spyOn(authLib, 'useAuth').mockReturnValue({
      recoveryToken: null,
      clearRecoveryToken: mockClearRecoveryToken,
      loading: false,
    } as any);

    // Mock window location hash without token
    Object.defineProperty(window, 'location', {
      value: { hash: '' },
      writable: true,
    });

    renderWithRouter(<ResetPassword />);
    expect(screen.getByText(/link inválido/i)).toBeInTheDocument();
    
    const backButton = screen.getByRole('button', { name: /volver al inicio/i });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true });
  });

  it('renders password form if token is valid', () => {
    renderWithRouter(<ResetPassword />);
    expect(screen.getByText(/nueva contraseña/i, { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nueva contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirmar contraseña$/i)).toBeInTheDocument();
  });

  it('handles successful password reset', async () => {
    (backendApi.post as any).mockResolvedValueOnce({});

    renderWithRouter(<ResetPassword />);

    const newPassInput = screen.getByLabelText(/^nueva contraseña$/i);
    const confirmPassInput = screen.getByLabelText(/^confirmar contraseña$/i);
    
    // Type strong password
    fireEvent.change(newPassInput, { target: { value: 'Valid1Password!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'Valid1Password!' } });

    const submitBtn = screen.getByRole('button', { name: /cambiar contraseña/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(backendApi.post).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
        access_token: 'valid-token',
        new_password: 'Valid1Password!',
      });
    });

    // Should transition to success state
    expect(screen.getByText(/¡listo!/i)).toBeInTheDocument();
    expect(mockClearRecoveryToken).toHaveBeenCalled();

    // Clicking 'Ir a iniciar sesión' navigates
    const loginBtn = screen.getByRole('button', { name: /ir a iniciar sesión/i });
    fireEvent.click(loginBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true });
  });

  it('shows error if passwords do not match', () => {
    renderWithRouter(<ResetPassword />);

    const newPassInput = screen.getByLabelText(/^nueva contraseña$/i);
    const confirmPassInput = screen.getByLabelText(/^confirmar contraseña$/i);
    
    fireEvent.change(newPassInput, { target: { value: 'Valid1Password!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'Different123!' } });

    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    
    const submitBtn = screen.getByRole('button', { name: /cambiar contraseña/i });
    expect(submitBtn).toBeDisabled();
  });
});
