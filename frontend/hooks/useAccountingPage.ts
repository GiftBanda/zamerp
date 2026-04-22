import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { accountingApi } from '@/lib/api';
import { TRANSACTION_CATEGORIES } from '@/lib/utils';

const TABS = ['transactions', 'summary', 'accounts'] as const;
type Tab = typeof TABS[number];

export function useAccountingPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('transactions');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', typeFilter],
    queryFn: () => accountingApi.transactions({ type: typeFilter !== 'all' ? typeFilter : undefined, limit: 100 }),
  });

  const { data: summary } = useQuery({
    queryKey: ['accounting-summary'],
    queryFn: () => accountingApi.summary(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountingApi.accounts,
    enabled: tab === 'accounts',
  });

  const createMutation = useMutation({
    mutationFn: accountingApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      toast.success('Transaction recorded');
      setModal(false);
      transactionForm.reset({});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: accountingApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      toast.success('Transaction deleted');
    },
  });

  const transactionForm = useForm<any>({
    defaultValues: {
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      amount: '',
    },
  });

  const watchType = transactionForm.watch('type');
  const categories = watchType === 'income'
    ? TRANSACTION_CATEGORIES.income
    : TRANSACTION_CATEGORIES.expense;

  const onSubmit = (data: any) => {
    createMutation.mutate({ ...data, amount: parseFloat(data.amount) });
  };

  const openModal = () => {
    transactionForm.reset({});
    setModal(true);
  };

  const netProfit = Number(summary?.totalIncome || 0) - Number(summary?.totalExpenses || 0);

  return {
    tabs: TABS,
    tab,
    setTab,
    typeFilter,
    setTypeFilter,
    modal,
    setModal,
    transactions,
    isLoading,
    summary,
    accounts,
    transactionForm,
    watchType,
    categories,
    onSubmit,
    openModal,
    createMutation,
    deleteMutation,
    netProfit,
  };
}
