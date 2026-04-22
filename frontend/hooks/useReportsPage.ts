import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, accountingApi } from '@/lib/api';

const TABS = ['profit-loss', 'aging', 'charts'] as const;
type Tab = typeof TABS[number];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function useReportsPage() {
  const [tab, setTab] = useState<Tab>('profit-loss');
  const now = new Date();
  const [from, setFrom] = useState(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ['pl', from, to],
    queryFn: () => reportsApi.profitLoss(from, to),
    enabled: tab === 'profit-loss',
  });

  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ['aging'],
    queryFn: reportsApi.aging,
    enabled: tab === 'aging',
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthly-chart', now.getFullYear()],
    queryFn: () => accountingApi.monthly(now.getFullYear()),
    enabled: tab === 'charts',
  });

  const { data: expCategories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => accountingApi.categories({ type: 'expense' }),
    enabled: tab === 'charts',
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyChartData = monthNames.map((name, i) => {
    const month = i + 1;
    const income = monthly?.find((m: any) => Number(m.month) === month && m.type === 'income');
    const expense = monthly?.find((m: any) => Number(m.month) === month && m.type === 'expense');
    return {
      name,
      income: Number(income?.total || 0),
      expenses: Number(expense?.total || 0),
    };
  });

  const pieData = expCategories?.map((categoryItem: any) => ({
    name: categoryItem.category || 'Uncategorized',
    value: Number(categoryItem.total),
  })) || [];

  return {
    tabs: TABS,
    colors: COLORS,
    tab,
    setTab,
    now,
    from,
    setFrom,
    to,
    setTo,
    pl,
    plLoading,
    aging,
    agingLoading,
    monthlyChartData,
    pieData,
  };
}
