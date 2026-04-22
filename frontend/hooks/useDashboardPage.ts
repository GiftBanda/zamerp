import { useQuery } from '@tanstack/react-query';
import { reportsApi, invoicesApi } from '@/lib/api';

export function useDashboardPage() {
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

  return {
    summary,
    recentInvoices,
    isLoading,
    revenue,
    revenueChange,
    chartData,
    todayLabel,
  };
}
