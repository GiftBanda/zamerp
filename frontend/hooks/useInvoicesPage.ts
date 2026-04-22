import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoicesApi } from '@/lib/api';

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'void'];

export function useInvoicesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [payModal, setPayModal] = useState<{ open: boolean; invoice?: any }>({ open: false });
  const [payMethod, setPayMethod] = useState('cash');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => invoicesApi.list(status !== 'all' ? { status } : undefined),
  });

  const { data: stats } = useQuery({ queryKey: ['invoice-stats'], queryFn: invoicesApi.stats });

  const sendMutation = useMutation({
    mutationFn: invoicesApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice marked as sent');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, paymentMethod }: any) => invoicesApi.pay(id, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Invoice marked as paid - inventory updated automatically');
      setPayModal({ open: false });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const voidMutation = useMutation({
    mutationFn: invoicesApi.void,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice voided');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const handleDownloadPdf = (invoice: any) => {
    invoicesApi.downloadPdf(invoice.id).catch((e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to download invoice PDF');
    });
  };

  const openPayModal = (invoice: any) => {
    setPayMethod('cash');
    setPayModal({ open: true, invoice });
  };

  const closePayModal = () => {
    setPayModal({ open: false });
  };

  const confirmPayment = () => {
    if (!payModal.invoice) {
      return;
    }
    payMutation.mutate({ id: payModal.invoice.id, paymentMethod: payMethod });
  };

  return {
    statuses: STATUSES,
    status,
    setStatus,
    payModal,
    payMethod,
    setPayMethod,
    invoices,
    isLoading,
    stats,
    sendMutation,
    payMutation,
    voidMutation,
    handleDownloadPdf,
    openPayModal,
    closePayModal,
    confirmPayment,
  };
}
