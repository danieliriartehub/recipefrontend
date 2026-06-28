import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import { supabase } from './supabase';
import { backendApi } from './backendApi';
import React from 'react';

// Mock Supabase client
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      setSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock backendApi
vi.mock('./backendApi', () => ({
  backendApi: {
    post: vi.fn(),
    postAuth: vi.fn(),
    withToken: vi.fn(() => ({
      get: vi.fn(),
    })),
  },
}));

// Suppress console warnings about backend timeouts during tests
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AuthProvider', () => {
  let mockGetSession: any;
  let mockOnAuthStateChange: any;
  let unsubscribeMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    
    unsubscribeMock = vi.fn();
    mockGetSession = supabase.auth.getSession as any;
    mockOnAuthStateChange = supabase.auth.onAuthStateChange as any;

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });
    
    // Default: silentRefresh fails (no cookie) -> no token returned
    (backendApi.post as any).mockRejectedValue(new Error('No token'));
  });

  it('should initialize with loading state and resolve to no user if no session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    // Wait for the bootstrap to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should successfully signIn and update the context', async () => {
    // 1. App starts without session
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    // 2. User calls signIn
    const mockSession = {
      access_token: 'test-access-token',
      user: { id: 'user-1', email: 'test@example.com' },
    };
    
    // backendApi returns the mock session
    (backendApi.post as any).mockResolvedValueOnce({ session: mockSession });
    
    // supabase setSession succeeds
    (supabase.auth.setSession as any).mockResolvedValueOnce({
      data: { session: mockSession }, error: null
    });

    // We must also mock the profile fetch inside activateSession
    const mockProfile = { id: 'user-1', points: 100 };
    const mockWithTokenGet = vi.fn().mockResolvedValue(mockProfile);
    (backendApi.withToken as any).mockReturnValue({ get: mockWithTokenGet });

    let signInResult;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password123');
    });

    expect(signInResult).toEqual({ error: null });
    
    // Verify the state has updated
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.profile).toEqual(mockProfile);
  });

  it('should clear state on signOut', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });
});
