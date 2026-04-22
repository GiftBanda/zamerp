import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockAuditList = vi.fn();

vi.mock('@/lib/api', () => ({
  auditApi: { list: (...args: any[]) => mockAuditList(...args) },
}));

import { useAuditLogsPage } from '@/hooks/useAuditLogsPage';

const MOCK_LOGS = [
  { id: '1', action: 'CREATE', resource: 'invoices', createdAt: '2026-01-01' },
  { id: '2', action: 'DELETE', resource: 'customers', createdAt: '2026-01-02' },
];

describe('useAuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditList.mockResolvedValue(MOCK_LOGS);
  });

  it('returns expected initial state', async () => {
    const { result } = renderHook(() => useAuditLogsPage(), { wrapper: createWrapper() });

    expect(result.current.resource).toBe('');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.logs).toEqual([]);
    expect(result.current.resources).toContain('invoices');
    expect(result.current.resources).toContain('customers');

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toEqual(MOCK_LOGS);
  });

  it('updates resource filter', () => {
    const { result } = renderHook(() => useAuditLogsPage(), { wrapper: createWrapper() });
    act(() => result.current.setResource('invoices'));
    expect(result.current.resource).toBe('invoices');
  });

  it('queries with undefined resource when resource is empty', async () => {
    renderHook(() => useAuditLogsPage(), { wrapper: createWrapper() });
    await waitFor(() =>
      expect(mockAuditList).toHaveBeenCalledWith({ resource: undefined, limit: 100 }),
    );
  });

  it('queries with resource when resource is set', async () => {
    const { result } = renderHook(() => useAuditLogsPage(), { wrapper: createWrapper() });
    act(() => result.current.setResource('customers'));
    await waitFor(() =>
      expect(mockAuditList).toHaveBeenCalledWith({ resource: 'customers', limit: 100 }),
    );
  });

  it('ACTION_COLORS has expected keys', () => {
    const { result } = renderHook(() => useAuditLogsPage(), { wrapper: createWrapper() });
    const colors = result.current.actionColors;
    expect(colors).toHaveProperty('CREATE');
    expect(colors).toHaveProperty('UPDATE');
    expect(colors).toHaveProperty('DELETE');
    expect(colors).toHaveProperty('LOGIN');
  });

  it('resources list includes all expected values', () => {
    const { result } = renderHook(() => useAuditLogsPage(), { wrapper: createWrapper() });
    const expectedResources = ['invoices', 'customers', 'products', 'transactions', 'users', 'tenants', 'auth'];
    expectedResources.forEach((r) => expect(result.current.resources).toContain(r));
  });
});
