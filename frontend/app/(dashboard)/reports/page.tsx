'use client';

import { useReportsPage } from '@/hooks/useReportsPage';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const {
    tabs,
    colors,
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
  } = useReportsPage();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Financial reports & analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {t === 'profit-loss' ? 'Profit & Loss' : t === 'aging' ? 'AR Aging' : 'Charts'}
          </button>
        ))}
      </div>

      {/* P&L Report */}
      {tab === 'profit-loss' && (
        <div className="space-y-5">
          {/* Date range */}
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input py-1.5 text-sm w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input py-1.5 text-sm w-auto" />
            </div>
          </div>

          {plLoading ? (
            <div className="card p-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pl ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Income */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 bg-green-50 border-b border-green-100">
                  <h3 className="font-semibold text-green-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Income
                  </h3>
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {pl.income.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-td text-gray-700">{item.category || 'Uncategorized'}</td>
                        <td className="table-td text-right font-medium text-green-600">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {pl.income.items.length === 0 && (
                      <tr><td colSpan={2} className="table-td text-center text-gray-400 py-8">No income recorded</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-green-50 border-t border-green-100">
                    <tr>
                      <td className="table-td font-bold text-green-800">Total Income</td>
                      <td className="table-td text-right font-bold text-green-800">{formatCurrency(pl.income.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Expenses */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 bg-red-50 border-b border-red-100">
                  <h3 className="font-semibold text-red-800 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Expenses
                  </h3>
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {pl.expenses.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-td text-gray-700">{item.category || 'Uncategorized'}</td>
                        <td className="table-td text-right font-medium text-red-500">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {pl.expenses.items.length === 0 && (
                      <tr><td colSpan={2} className="table-td text-center text-gray-400 py-8">No expenses recorded</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-red-50 border-t border-red-100">
                    <tr>
                      <td className="table-td font-bold text-red-800">Total Expenses</td>
                      <td className="table-td text-right font-bold text-red-800">{formatCurrency(pl.expenses.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Net Summary */}
              <div className="md:col-span-2 card p-5">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Gross Income</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(pl.grossProfit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(pl.expenses.total)}</p>
                  </div>
                  <div className="border-l border-gray-200 pl-6">
                    <p className="text-sm text-gray-500">Net {pl.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className={cn('text-2xl font-bold mt-1', pl.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500')}>
                      {formatCurrency(Math.abs(pl.netProfit))}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Margin: {pl.profitMargin?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Aging Report */}
      {tab === 'aging' && (
        <div className="space-y-5">
          {agingLoading ? (
            <div className="card p-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-spin animate-spin" />
            </div>
          ) : aging ? (
            <>
              {/* Bucket summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(aging.buckets).map(([key, val]: any) => (
                  <div key={key} className={cn('card p-4 text-center',
                    key === '90+' && val > 0 ? 'border-red-200 bg-red-50' : ''
                  )}>
                    <p className="text-xs text-gray-500 mb-1">{key === 'current' ? 'Current' : `${key} days`}</p>
                    <p className={cn('text-lg font-bold', val > 0 ? key === '90+' ? 'text-red-600' : key === '61-90' ? 'text-orange-500' : 'text-gray-900' : 'text-gray-400')}>
                      {formatCurrency(val)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="card p-4 flex items-center gap-3 bg-orange-50 border-orange-200">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Total Outstanding</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(aging.total)}</p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="table-th">Invoice</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Due Date</th>
                      <th className="table-th">Age (days)</th>
                      <th className="table-th">Bucket</th>
                      <th className="table-th text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {aging.items.length === 0 ? (
                      <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No outstanding invoices</td></tr>
                    ) : aging.items.map((item: any) => (
                      <tr key={item.id} className={cn('hover:bg-gray-50', item.bucket === '90+' ? 'bg-red-50/30' : '')}>
                        <td className="table-td font-mono text-sm text-brand-600">{item.invoiceNumber}</td>
                        <td className="table-td font-medium text-gray-900">{item.customerName}</td>
                        <td className="table-td text-gray-600 text-sm">{item.dueDate ? formatDate(item.dueDate) : '—'}</td>
                        <td className="table-td">
                          <span className={cn('font-semibold', item.ageDays > 90 ? 'text-red-600' : item.ageDays > 60 ? 'text-orange-500' : 'text-gray-700')}>
                            {item.ageDays}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className={cn('badge',
                            item.bucket === '90+' ? 'bg-red-100 text-red-700' :
                            item.bucket === '61-90' ? 'bg-orange-100 text-orange-700' :
                            item.bucket === '31-60' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          )}>{item.bucket}</span>
                        </td>
                        <td className="table-td text-right font-semibold text-gray-900">{formatCurrency(item.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Charts tab */}
      {tab === 'charts' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Income vs Expenses ({now.getFullYear()})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: any, name: string) => [formatCurrency(v), name === 'income' ? 'Income' : 'Expenses']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend formatter={v => v === 'income' ? 'Income' : 'Expenses'} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown by Category</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
