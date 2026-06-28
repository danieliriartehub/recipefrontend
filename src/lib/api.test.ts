import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from './api';
import { backendApi } from './backendApi';
import { supabase } from './supabase';

// Mock backendApi
vi.mock('./backendApi', () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPatch = vi.fn();
  const mockDelete = vi.fn();

  return {
    backendApi: {
      get: mockGet,
      post: mockPost,
      withToken: vi.fn(() => ({
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
        delete: mockDelete,
      })),
    },
  };
});

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('api.ts', () => {
  const mockToken = 'test-token';
  const mockGetSession = supabase.auth.getSession as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: mockToken } },
    });
  });

  describe('getToken Helper', () => {
    it('should throw an error if no session is available', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });
      await expect(api.getMissionsWithProgress('1')).rejects.toThrow('No autenticado');
      
      // We can also test the error if there is a session but no token (though types try to prevent it)
      mockGetSession.mockResolvedValueOnce({ data: { session: { access_token: null } } });
      await expect(api.getMissionsWithProgress('1')).rejects.toThrow('No autenticado');
    });
  });

  describe('Centers API', () => {
    it('getCenters should call backendApi.get without token', async () => {
      await api.getCenters();
      expect(backendApi.get).toHaveBeenCalledWith('/api/v1/centers/');
    });

    it('searchCenters should correctly build query string', async () => {
      await api.searchCenters({ campus: 'Main', material: 'Paper', onlyActive: true });
      expect(backendApi.get).toHaveBeenCalledWith('/api/v1/centers/search?campus=Main&material=Paper&only_active=true');
    });
  });

  describe('Wallet API', () => {
    it('getUserBalance should call backendApi.withToken', async () => {
      await api.getUserBalance('user123');
      expect(backendApi.withToken).toHaveBeenCalledWith(mockToken);
      const mockApi = backendApi.withToken(mockToken);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/wallet/balance');
    });
  });

  describe('Marketplace API', () => {
    it('getMarketplaceProducts should handle params properly', async () => {
      await api.getMarketplaceProducts({ search_query: 'apple', category: 'Todos' });
      const mockApi = backendApi.withToken(mockToken);
      // 'Todos' is ignored as per the logic in api.ts
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/marketplace/products?search_query=apple');
    });
  });

  describe('Auth dependent endpoints', () => {
    it('should pass correct params for insertRecycling', async () => {
      const payload = {
        user_id: '1',
        center_id: '2',
        material: 'Vidrio',
        kg: 1.5,
        points_earned: 150,
        co2_saved_kg: 2,
      };
      await api.insertRecycling(payload);
      const mockApi = backendApi.withToken(mockToken);
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/recyclings/', payload);
    });
  });
});
