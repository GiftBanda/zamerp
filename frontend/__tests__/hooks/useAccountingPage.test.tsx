import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockTransactions = vi.fn();
const mockSummary = vi.fn();
const mockAccounts = vi.fn();
const mockCreateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();

vi.mock('@/lib/api', () => ({
  accountingApi: {
    transactions: (...args: any[]) => mockTransactions(...args),
    summary: (...args: any[]) => mockSummary(...args),
    accounts: (...args: any[]) => mockAccounts(...args),
    createTransaction: (...args: any[]) => mockCreateTransaction(...args),
    deleteTransaction: (...args: any[]) => mockDeleteTransaction(...args),
  },
}));

vi.mock('@/lib/utils', () => ({
  TRANSACTION_CATEGORIES: {
    income: ['Sales', 'Service Revenue', 'Other Income'],
    expense: ['Rent', 'Utilities', 'Salaries', 'Other Expense'],
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useAccountingPage } from '@/hooks/useAccountingPage';

const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'income', amount: 5000, category: 'Sales' },
  { id: 't2', type: 'expense', amount: 1500, category: 'Rent' },
];
const MOCK_SUMMARY = { totalIncome: '10000', totalExpenses: '4000' };
const MOCK_ACCOUNTS = [{ id: 'a1', name: 'Cash' }];

describe('useAccountingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactions.mockResolvedValue(MOCK_TRANSACTIONS);
    mockSummary.mockResolvedValue(MOCK_SUMMARY);
    mockAccounts.mockResolvedValue(MOCK_ACCOUNTS);
  });

  it('returns expected initial state', async () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });

    expect(result.current.tab).toBe('transactions');
    expect(result.current.typeFilter).toBe('all');
    expect(result.current.modal).toBe(false);
    expect(result.current.tabs).toContain('transactions');
    expect(result.current.tabs).toContain('summary');

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transactions).toEqual(MOCK_TRANSACTIONS);
    expect(result.current.summary).toEqual(MOCK_SUMMARY);
  });

  it('changes tab', () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    act(() => result.current.setTab('summary'));
    expect(result.current.tab).toBe('summary');
  });

  it('changes typeFilter', () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    act(() => result.current.setTypeFilter('expense'));
    expect(result.current.typeFilter).toBe('expense');
  });

  it('openModal sets modal to true', () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    act(() => result.current.openModal());
    expect(result.current.modal).toBe(true);
  });

  it('calculates netProfit from summary', async () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.netProfit).toBe(6000); // 10000 - 4000
  });

  it('netProfit defaults to 0 when summary is undefined', () => {
    mockSummary.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    expect(result.current.netProfit).toBe(0);
  });

  it('categories reflect income when watchType is income', async () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // default type is 'income'
    expect(result.current.categories).toContain('Sales');
    expect(result.current.categories).not.toContain('Rent');
  });

  it('queries with type filter when typeFilter is not "all"', async () => {
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    act(() => result.current.setTypeFilter('income'));
    await waitFor(() =>
      expect(mockTransactions).toHaveBeenCalledWith({ type: 'income', limit: 100 }),
    );
  });

  it('queries with undefined type when typeFilter is "all"', async () => {
    renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    await waitFor(() =>
      expect(mockTransactions).toHaveBeenCalledWith({ type: undefined, limit: 100 }),
    );
  });

  it('onSubmit parses amount and calls createMutation', async () => {
    mockCreateTransaction.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAccountingPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.onSubmit({ type: 'income', amount: '1500.50', category: 'Sales', date: '2026-01-01' });
    });

    // TanStack Query v5 passes a second internal options arg to mutationFn
    expect(mockCreateTransaction).toHaveBeenCalledWith(
      { type: 'income', amount: 1500.5, category: 'Sales', date: '2026-01-01' },
      expect.anything(),
    );
  });
});
