import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/api', () => ({
  customersApi: {
    list: (...args: any[]) => mockList(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    remove: (...args: any[]) => mockRemove(...args),
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCustomersPage } from '@/hooks/useCustomersPage';

const MOCK_CUSTOMERS = [
  { id: '1', name: 'Acme Corp', email: 'acme@example.com' },
  { id: '2', name: 'Beta Ltd', email: 'beta@example.com' },
];

describe('useCustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(MOCK_CUSTOMERS);
  });

  it('returns expected initial state', async () => {
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });

    expect(result.current.search).toBe('');
    expect(result.current.modal).toEqual({ open: false });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.customers).toEqual([]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.customers).toEqual(MOCK_CUSTOMERS);
  });

  it('updates search state', () => {
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    act(() => result.current.setSearch('acme'));
    expect(result.current.search).toBe('acme');
  });

  it('openCreate opens modal with no customer', async () => {
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openCreate());
    expect(result.current.modal).toEqual({ open: true });
  });

  it('openEdit opens modal with customer data', async () => {
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openEdit(MOCK_CUSTOMERS[0]));
    expect(result.current.modal).toEqual({ open: true, customer: MOCK_CUSTOMERS[0] });
  });

  it('closeModal closes modal', async () => {
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openCreate());
    act(() => result.current.closeModal());
    expect(result.current.modal.open).toBe(false);
  });

  it('calls list API with search when search is non-empty', async () => {
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    act(() => result.current.setSearch('beta'));
    await waitFor(() => expect(mockList).toHaveBeenCalledWith('beta'));
  });

  it('calls list API with undefined when search is empty', async () => {
    renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockList).toHaveBeenCalledWith(undefined));
  });

  it('calls create mutation on onSubmit without existing customer', async () => {
    mockCreate.mockResolvedValueOnce({ id: '3', name: 'New Co' });
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openCreate());
    await act(async () => {
      await result.current.onSubmit({ name: 'New Co', email: '' });
    });

    // TanStack Query v5 passes a second internal options arg to mutationFn
    expect(mockCreate).toHaveBeenCalledWith({ name: 'New Co', email: '' }, expect.anything());
  });

  it('calls update mutation on onSubmit with existing customer', async () => {
    mockUpdate.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openEdit(MOCK_CUSTOMERS[0]));
    await act(async () => {
      await result.current.onSubmit({ name: 'Acme Corp Updated', email: '' });
    });

    // Hook calls: customersApi.update(id, data) with separate args
    expect(mockUpdate).toHaveBeenCalledWith('1', { name: 'Acme Corp Updated', email: '' });
  });

  it('deleteCustomer calls remove mutation', async () => {
    mockRemove.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCustomersPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.deleteCustomer('1');
    });

    expect(mockRemove).toHaveBeenCalledWith('1', expect.anything());
  });
});
