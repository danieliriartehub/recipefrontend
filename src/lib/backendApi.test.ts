import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backendApi } from './backendApi';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('backendApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Simulate successful JSON response by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
  });

  describe('apiFetch base behavior', () => {
    it('should include credentials and content-type headers by default', async () => {
      await backendApi.get('/test');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should return undefined for 204 No Content responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });
      const result = await backendApi.post('/test', { data: 1 });
      expect(result).toBeUndefined();
    });

    it('should throw an error if response is not ok and contains detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Custom Error Message' }),
      });
      await expect(backendApi.get('/error')).rejects.toThrow('Custom Error Message');
    });

    it('should throw an error with status text if no JSON detail is present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('No JSON'); },
      });
      await expect(backendApi.get('/error')).rejects.toThrow('Internal Server Error');
    });
  });

  describe('unauthenticated methods', () => {
    it('get should make a GET request without token', async () => {
      await backendApi.get('/public');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/public'), expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    it('post should make a POST request with stringified body', async () => {
      const body = { id: 1 };
      await backendApi.post('/public', body);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/public'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }));
    });
  });

  describe('authenticated methods via withToken', () => {
    const token = 'fake-jwt-token';
    const authApi = backendApi.withToken(token);

    it('should include Bearer token in headers for get', async () => {
      await authApi.get('/private');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/private'), expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }));
    });

    it('should include Bearer token and body for post', async () => {
      await authApi.post('/private', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/private'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${token}`
        }),
        body: JSON.stringify({ data: 'test' })
      }));
    });

    it('should include Bearer token and body for patch', async () => {
      await authApi.patch('/private', { data: 'update' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/private'), expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${token}`
        }),
        body: JSON.stringify({ data: 'update' })
      }));
    });

    it('should include Bearer token for delete', async () => {
      await authApi.delete('/private');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/private'), expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${token}`
        }),
      }));
    });
  });
});
