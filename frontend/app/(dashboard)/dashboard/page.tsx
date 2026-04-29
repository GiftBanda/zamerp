'use client';

import { useDashboardPage } from '@/hooks/useDashboardPage';
import { formatCurrency, STATUS_COLORS } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, FileText, Users, Package,
  AlertTriangle, ArrowRight, DollarSign, Activity, Sparkles, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const {
    summary,
    recentInvoices,
    isLoading,
    revenue,
    revenueChange,
    chartData,
    todayLabel,
    aiSummary,
    generateAiSummary,
    isAiSummaryPending,
  } = useDashboardPage();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {todayLabel}
          </p>
        </div>
        <button
          onClick={() => generateAiSummary()}
          disabled={isAiSummaryPending}
          className="btn-secondary"
        >
          {isAiSummaryPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isAiSummaryPending ? 'Generating summary...' : 'Generate AI Summary'}
        </button>
      </div>

      {aiSummary && (
        <div className="card p-5 border border-brand-100 bg-gradient-to-br from-brand-50 to-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Business Summary</h3>
                <p className="text-xs text-gray-500">
                  {aiSummary.source === 'deepseek' ? `DeepSeek${aiSummary.model ? ` • ${aiSummary.model}` : ''}` : 'Local fallback summary'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {new Date(aiSummary.generatedAt).toLocaleString('en-ZM')}
            </p>
          </div>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {aiSummary.summary}
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(revenue?.thisMonth ?? 0)}
          change={revenueChange}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Outstanding Invoices"
          value={formatCurrency(summary?.invoices?.outstandingAmount ?? 0)}
          subtitle={`${summary?.invoices?.sent ?? 0} unpaid invoices`}
          icon={<FileText className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Active Customers"
          value={summary?.customers?.total ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Low Stock Items"
          value={summary?.inventory?.lowStock ?? 0}
          subtitle="Below reorder level"
          icon={<AlertTriangle className="w-5 h-5" />}
          color={summary?.inventory?.lowStock > 0 ? 'red' : 'green'}
          alert={summary?.inventory?.lowStock > 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No revenue data yet" />
          )}
        </div>

        {/* Invoice status breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Paid', count: summary?.invoices?.paidInvoices, color: 'bg-green-500' },
              { label: 'Sent', count: summary?.invoices?.sent, color: 'bg-blue-500' },
              { label: 'Overdue', count: summary?.invoices?.overdueInvoices, color: 'bg-red-500' },
              { label: 'Draft', count: summary?.invoices?.draft, color: 'bg-gray-300' },
            ].map(s => {
              const total = summary?.invoices?.totalInvoices || 1;
              const pct = Math.round((Number(s.count || 0) / Number(total)) * 100);
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium text-gray-900">{s.count ?? 0}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total invoiced</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(summary?.invoices?.paidAmount ?? 0)}
              </span>
            </div>
          </div>

          <Link href="/invoices" className="mt-3 flex items-center gap-1 text-xs text-brand-600 hover:underline">
            View all invoices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent invoices */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
            <Link href="/invoices" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInvoices?.slice(0, 5).map((inv: any) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{inv.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                  <span className={cn('badge', STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600')}>
                    {inv.status}
                  </span>
                </div>
              </Link>
            )) ?? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No invoices yet</p>
            )}
          </div>
        </div>

        {/* Top customers */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Top Customers</h3>
            <Link href="/customers" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {summary?.topCustomers?.map((c: any, i: number) => (
              <div key={c.customerId} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.customerName}</p>
                  <p className="text-xs text-gray-500">{c.invoiceCount} invoices</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.totalBilled)}</p>
              </div>
            )) ?? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No customer data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, subtitle, icon, color, alert }: any) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
  };
  const c = colors[color as keyof typeof colors] || colors.blue;

  return (
    <div className={cn('card p-5', alert && 'border-red-200')}>
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-xl border', c.bg, c.border)}>
          <span className={c.icon}>{icon}</span>
        </div>
        {change !== undefined && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            change >= 0 ? 'text-green-600' : 'text-red-500',
          )}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle || title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{title}</p>}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-72 bg-gray-200 rounded-xl" />
        <div className="h-72 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
