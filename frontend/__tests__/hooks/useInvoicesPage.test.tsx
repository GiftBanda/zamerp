import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockList = vi.fn();
const mockStats = vi.fn();
const mockSend = vi.fn();
const mockPay = vi.fn();
const mockVoid = vi.fn();
const mockDownloadPdf = vi.fn();

vi.mock('@/lib/api', () => ({
  invoicesApi: {
    list: (...args: any[]) => mockList(...args),
    stats: (...args: any[]) => mockStats(...args),
    send: (...args: any[]) => mockSend(...args),
    pay: (...args: any[]) => mockPay(...args),
    void: (...args: any[]) => mockVoid(...args),
    downloadPdf: (...args: any[]) => mockDownloadPdf(...args),
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useInvoicesPage } from '@/hooks/useInvoicesPage';

const MOCK_INVOICES = [
  { id: 'inv-1', status: 'draft', total: 500 },
  { id: 'inv-2', status: 'sent', total: 1000 },
];
const MOCK_STATS = { total: 2, paid: 0, overdue: 0 };

describe('useInvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(MOCK_INVOICES);
    mockStats.mockResolvedValue(MOCK_STATS);
    mockDownloadPdf.mockResolvedValue(undefined);
  });

  it('returns expected initial state', async () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });

    expect(result.current.status).toBe('all');
    expect(result.current.payModal).toEqual({ open: false });
    expect(result.current.payMethod).toBe('cash');
    expect(result.current.statuses).toContain('all');
    expect(result.current.statuses).toContain('paid');
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invoices).toEqual(MOCK_INVOICES);
    expect(result.current.stats).toEqual(MOCK_STATS);
  });

  it('changes status filter', () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    act(() => result.current.setStatus('paid'));
    expect(result.current.status).toBe('paid');
  });

  it('queries without status filter when status is "all"', async () => {
    renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockList).toHaveBeenCalledWith(undefined));
  });

  it('queries with status filter when status is not "all"', async () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    act(() => result.current.setStatus('paid'));
    await waitFor(() => expect(mockList).toHaveBeenCalledWith({ status: 'paid' }));
  });

  it('openPayModal sets modal open with invoice and resets payMethod', async () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPayMethod('bank'));
    act(() => result.current.openPayModal(MOCK_INVOICES[0]));

    expect(result.current.payModal).toEqual({ open: true, invoice: MOCK_INVOICES[0] });
    expect(result.current.payMethod).toBe('cash');
  });

  it('closePayModal closes the modal', async () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openPayModal(MOCK_INVOICES[0]));
    act(() => result.current.closePayModal());
    expect(result.current.payModal.open).toBe(false);
  });

  it('confirmPayment does nothing when no invoice in modal', async () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => result.current.confirmPayment());
    expect(mockPay).not.toHaveBeenCalled();
  });

  it('confirmPayment calls payMutation with invoice id and payMethod', async () => {
    mockPay.mockResolvedValueOnce({});
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openPayModal(MOCK_INVOICES[0]));
    act(() => result.current.setPayMethod('mobile_money'));

    await act(async () => result.current.confirmPayment());
    expect(mockPay).toHaveBeenCalledWith('inv-1', { paymentMethod: 'mobile_money' });
  });

  it('handleDownloadPdf calls authenticated pdf download', async () => {
    const { result } = renderHook(() => useInvoicesPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.handleDownloadPdf(MOCK_INVOICES[0]));
    await waitFor(() => expect(mockDownloadPdf).toHaveBeenCalledWith('inv-1'));
  });
});
