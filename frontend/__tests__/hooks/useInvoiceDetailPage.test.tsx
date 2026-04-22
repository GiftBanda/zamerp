import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockPush = vi.fn();
const mockParams = vi.fn(() => ({ id: 'inv-42' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams(),
}));

const mockGet = vi.fn();
const mockSend = vi.fn();
const mockPay = vi.fn();
const mockVoid = vi.fn();
const mockDownloadPdf = vi.fn();

vi.mock('@/lib/api', () => ({
  invoicesApi: {
    get: (...args: any[]) => mockGet(...args),
    send: (...args: any[]) => mockSend(...args),
    pay: (...args: any[]) => mockPay(...args),
    void: (...args: any[]) => mockVoid(...args),
    downloadPdf: (...args: any[]) => mockDownloadPdf(...args),
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useInvoiceDetailPage } from '@/hooks/useInvoiceDetailPage';

const MOCK_INVOICE = { id: 'inv-42', status: 'draft', total: 2500 };

describe('useInvoiceDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(MOCK_INVOICE);
    mockDownloadPdf.mockResolvedValue(undefined);
  });

  it('extracts id from params and fetches invoice', async () => {
    const { result } = renderHook(() => useInvoiceDetailPage(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith('inv-42');
    expect(result.current.invoice).toEqual(MOCK_INVOICE);
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useInvoiceDetailPage(), { wrapper: createWrapper() });

    expect(result.current.payModal).toBe(false);
    expect(result.current.payMethod).toBe('cash');
    expect(result.current.router).toBeDefined();
  });

  it('toggles payModal', () => {
    const { result } = renderHook(() => useInvoiceDetailPage(), { wrapper: createWrapper() });

    act(() => result.current.setPayModal(true));
    expect(result.current.payModal).toBe(true);

    act(() => result.current.setPayModal(false));
    expect(result.current.payModal).toBe(false);
  });

  it('updates payMethod', () => {
    const { result } = renderHook(() => useInvoiceDetailPage(), { wrapper: createWrapper() });
    act(() => result.current.setPayMethod('bank_transfer'));
    expect(result.current.payMethod).toBe('bank_transfer');
  });

  it('handleDownload calls authenticated pdf download', async () => {
    const { result } = renderHook(() => useInvoiceDetailPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.handleDownload());
    await waitFor(() => expect(mockDownloadPdf).toHaveBeenCalledWith('inv-42'));
  });

  it('sendMutation is defined', async () => {
    const { result } = renderHook(() => useInvoiceDetailPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sendMutation).toBeDefined();
    expect(typeof result.current.sendMutation.mutate).toBe('function');
  });
});
