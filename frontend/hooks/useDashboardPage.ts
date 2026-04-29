import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { reportsApi, invoicesApi } from '@/lib/api';
import { toast } from 'sonner';

export function useDashboardPage() {
  const [aiSummary, setAiSummary] = useState<any>(null);
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  });

  const { data: recentInvoices } = useQuery({
    queryKey: ['invoices', 'recent'],
    queryFn: () => invoicesApi.list({ limit: 5 }),
  });

  const revenue = summary?.revenue;
  const revenueChange = revenue?.change ?? 0;

  const chartData = (summary?.monthlyRevenue || []).map((monthItem: any) => ({
    name: monthItem.month,
    revenue: Number(monthItem.revenue),
    invoices: Number(monthItem.invoices),
  }));

  const todayLabel = new Date().toLocaleDateString('en-ZM', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const aiSummaryMutation = useMutation({
    mutationFn: (focus?: string) => reportsApi.aiSummary(focus),
    onSuccess: (data) => {
      setAiSummary(data);
      toast.success(data?.source === 'deepseek' ? 'AI summary generated' : 'Summary generated with local fallback');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to generate AI summary'),
  });

  return {
    summary,
    recentInvoices,
    isLoading,
    revenue,
    revenueChange,
    chartData,
    todayLabel,
    aiSummary,
    generateAiSummary: (focus?: string) => aiSummaryMutation.mutate(focus),
    isAiSummaryPending: aiSummaryMutation.isPending,
  };
}
