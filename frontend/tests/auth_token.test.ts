import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, clearToken, ApiError } from '../src/services/api';

describe('API Token Utilities and ApiError', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves token in localStorage', () => {
    expect(getToken()).toBeNull();
    setToken('jwt-test-token-12345');
    expect(getToken()).toBe('jwt-test-token-12345');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('instantiates ApiError with status and message', () => {
    const err = new ApiError('Unauthorized access', 401, { detail: 'Token expired' });
    expect(err.message).toBe('Unauthorized access');
    expect(err.status).toBe(401);
    expect(err.data).toEqual({ detail: 'Token expired' });
  });
});
