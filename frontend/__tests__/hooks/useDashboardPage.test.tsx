import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockDashboard = vi.fn();
const mockInvoiceList = vi.fn();

vi.mock('@/lib/api', () => ({
  reportsApi: { dashboard: (...args: any[]) => mockDashboard(...args) },
  invoicesApi: { list: (...args: any[]) => mockInvoiceList(...args) },
}));

import { useDashboardPage } from '@/hooks/useDashboardPage';

const MOCK_SUMMARY = {
  revenue: { total: 50000, change: 12.5 },
  monthlyRevenue: [
    { month: 'Jan', revenue: '5000', invoices: '3' },
    { month: 'Feb', revenue: '8000', invoices: '5' },
  ],
};

const MOCK_INVOICES = [{ id: '1', total: 1000 }];

describe('useDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboard.mockResolvedValue(MOCK_SUMMARY);
    mockInvoiceList.mockResolvedValue(MOCK_INVOICES);
  });

  it('starts loading with no data', () => {
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.summary).toBeUndefined();
    expect(result.current.recentInvoices).toBeUndefined();
  });

  it('loads summary and recent invoices', async () => {
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.summary).toEqual(MOCK_SUMMARY);
    expect(result.current.recentInvoices).toEqual(MOCK_INVOICES);
  });

  it('derives revenue and revenueChange', async () => {
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.revenue).toEqual(MOCK_SUMMARY.revenue);
    expect(result.current.revenueChange).toBe(12.5);
  });

  it('maps monthlyRevenue to chartData with numeric values', async () => {
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.chartData).toEqual([
      { name: 'Jan', revenue: 5000, invoices: 3 },
      { name: 'Feb', revenue: 8000, invoices: 5 },
    ]);
  });

  it('defaults revenueChange to 0 when summary has no revenue', async () => {
    mockDashboard.mockResolvedValueOnce({ monthlyRevenue: [] });
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.revenueChange).toBe(0);
  });

  it('returns chartData as empty array when no monthlyRevenue', async () => {
    mockDashboard.mockResolvedValueOnce({ monthlyRevenue: [] });
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.chartData).toEqual([]);
  });

  it('todayLabel is a non-empty string', async () => {
    const { result } = renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    expect(typeof result.current.todayLabel).toBe('string');
    expect(result.current.todayLabel.length).toBeGreaterThan(0);
  });

  it('calls invoicesApi.list with limit 5', async () => {
    renderHook(() => useDashboardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockInvoiceList).toHaveBeenCalledWith({ limit: 5 }));
  });
});
