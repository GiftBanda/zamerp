import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock auth
const mockLogin = vi.fn();
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// Mock sonner
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useLoginForm } from '@/hooks/useLoginForm';

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useLoginForm());
    expect(result.current.register).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
    expect(result.current.errors).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.showPass).toBe(false);
    expect(typeof result.current.setShowPass).toBe('function');
    expect(typeof result.current.onSubmit).toBe('function');
  });

  it('toggles showPass', () => {
    const { result } = renderHook(() => useLoginForm());
    act(() => result.current.setShowPass(true));
    expect(result.current.showPass).toBe(true);
    act(() => result.current.setShowPass(false));
    expect(result.current.showPass).toBe(false);
  });

  it('calls login and redirects on successful submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({
        email: 'admin@example.com',
        password: 'password123',
        tenantSlug: 'acme',
      });
    });

    expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123', 'acme');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows toast error and does not redirect on failed login', async () => {
    const { toast } = await import('sonner');
    mockLogin.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({
        email: 'bad@example.com',
        password: 'wrong',
        tenantSlug: 'acme',
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  it('sets loading true during submit and false after', async () => {
    let resolveFn!: () => void;
    mockLogin.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveFn = resolve; }),
    );

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.onSubmit({ email: 'a@b.com', password: 'pass123', tenantSlug: 'co' });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveFn(); });

    expect(result.current.loading).toBe(false);
  });
});
