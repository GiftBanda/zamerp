import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockDashboard = vi.fn();
const mockProfitLoss = vi.fn();
const mockAging = vi.fn();
const mockMonthly = vi.fn();
const mockCategories = vi.fn();

vi.mock('@/lib/api', () => ({
  reportsApi: {
    dashboard: (...args: any[]) => mockDashboard(...args),
    profitLoss: (...args: any[]) => mockProfitLoss(...args),
    aging: (...args: any[]) => mockAging(...args),
  },
  accountingApi: {
    monthly: (...args: any[]) => mockMonthly(...args),
    categories: (...args: any[]) => mockCategories(...args),
  },
}));

import { useReportsPage } from '@/hooks/useReportsPage';

const MOCK_PL = { revenue: 100000, expenses: 60000, profit: 40000 };
const MOCK_AGING = [{ range: '0-30', amount: 5000 }];
const MOCK_MONTHLY = [
  { month: '1', type: 'income', total: '8000' },
  { month: '1', type: 'expense', total: '3000' },
];
const MOCK_CATEGORIES = [
  { category: 'Utilities', total: '1500' },
  { category: 'Salaries', total: '4500' },
];

describe('useReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfitLoss.mockResolvedValue(MOCK_PL);
    mockAging.mockResolvedValue(MOCK_AGING);
    mockMonthly.mockResolvedValue(MOCK_MONTHLY);
    mockCategories.mockResolvedValue(MOCK_CATEGORIES);
  });

  it('returns expected initial state', () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });

    expect(result.current.tab).toBe('profit-loss');
    // 'from' is Jan 1 of the current year; toISOString() may shift by timezone
    expect(result.current.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.tabs).toEqual(['profit-loss', 'aging', 'charts']);
    expect(result.current.colors).toBeInstanceOf(Array);
    expect(result.current.colors.length).toBeGreaterThan(0);
  });

  it('changes tab', () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    act(() => result.current.setTab('aging'));
    expect(result.current.tab).toBe('aging');
  });

  it('updates from and to dates', () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    act(() => result.current.setFrom('2026-03-01'));
    act(() => result.current.setTo('2026-03-31'));
    expect(result.current.from).toBe('2026-03-01');
    expect(result.current.to).toBe('2026-03-31');
  });

  it('fetches P&L when tab is profit-loss', async () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.plLoading).toBe(false));
    expect(result.current.pl).toEqual(MOCK_PL);
  });

  it('does not fetch aging when tab is profit-loss', async () => {
    renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockProfitLoss).toHaveBeenCalled());
    expect(mockAging).not.toHaveBeenCalled();
  });

  it('fetches aging when tab switches to aging', async () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    act(() => result.current.setTab('aging'));
    await waitFor(() => expect(result.current.aging).toEqual(MOCK_AGING));
  });

  it('builds monthlyChartData with 12 months', async () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    act(() => result.current.setTab('charts'));
    await waitFor(() => expect(result.current.monthlyChartData[0].income).toBe(8000));

    expect(result.current.monthlyChartData).toHaveLength(12);
    const jan = result.current.monthlyChartData[0];
    expect(jan.name).toBe('Jan');
    expect(jan.expenses).toBe(3000);
  });

  it('builds pieData from expense categories', async () => {
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    act(() => result.current.setTab('charts'));
    await waitFor(() =>
      expect(result.current.pieData).toEqual([
        { name: 'Utilities', value: 1500 },
        { name: 'Salaries', value: 4500 },
      ]),
    );
  });

  it('pieData defaults to empty array when no categories', () => {
    mockCategories.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useReportsPage(), { wrapper: createWrapper() });
    expect(result.current.pieData).toEqual([]);
  });
});
