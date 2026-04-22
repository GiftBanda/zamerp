import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRegister = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({
  authApi: { register: mockRegister },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useRegisterForm } from '@/hooks/useRegisterForm';

describe('useRegisterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns expected shape', () => {
    const { result } = renderHook(() => useRegisterForm());
    expect(result.current.register).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
    expect(result.current.errors).toBeDefined();
    expect(result.current.step).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.nextStep).toBe('function');
    expect(typeof result.current.onSubmit).toBe('function');
  });

  it('can set step directly', () => {
    const { result } = renderHook(() => useRegisterForm());
    act(() => result.current.setStep(2));
    expect(result.current.step).toBe(2);
  });

  it('calls authApi.register and redirects on success', async () => {
    mockRegister.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRegisterForm());

    const payload = {
      companyName: 'Acme Ltd',
      tenantSlug: 'acme',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@acme.com',
      password: 'secret123',
    };

    await act(async () => {
      await result.current.onSubmit(payload as any);
    });

    expect(mockRegister).toHaveBeenCalledWith(payload);
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('shows error toast when registration fails', async () => {
    const { toast } = await import('sonner');
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Slug taken' } },
    });
    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.onSubmit({
        companyName: 'Acme',
        tenantSlug: 'taken',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'pass1234',
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Slug taken');
  });

  it('does not advance step when validation fails', async () => {
    const { result } = renderHook(() => useRegisterForm());
    // form is empty, trigger will fail validation
    await act(async () => {
      await result.current.nextStep();
    });
    expect(result.current.step).toBe(1);
  });
});
