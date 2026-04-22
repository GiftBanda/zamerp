import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoicesApi } from '@/lib/api';

export function useInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id),
    enabled: Boolean(id),
  });

  const sendMutation = useMutation({
    mutationFn: () => invoicesApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Invoice marked as sent');
    },
  });

  const payMutation = useMutation({
    mutationFn: () => invoicesApi.pay(id, { paymentMethod: payMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Paid! Inventory updated automatically.');
      setPayModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const voidMutation = useMutation({
    mutationFn: () => invoicesApi.void(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Invoice voided');
    },
  });

  const handleDownload = () => {
    invoicesApi.downloadPdf(id).catch((e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to download invoice PDF');
    });
  };

  return {
    router,
    invoice,
    isLoading,
    payModal,
    setPayModal,
    payMethod,
    setPayMethod,
    sendMutation,
    payMutation,
    voidMutation,
    handleDownload,
  };
}
