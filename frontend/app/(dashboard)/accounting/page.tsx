'use client';

import { CustomTable } from '@/components/CustomTable';
import { useAccountingPage } from '@/hooks/useAccountingPage';
import { formatCurrency, formatDate, PAYMENT_METHODS, cn } from '@/lib/utils';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, X, Loader2, Trash2,
} from 'lucide-react';

export default function AccountingPage() {
  const {
    tabs,
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
  } = useAccountingPage();

  const { register, handleSubmit } = transactionForm;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
          <p className="text-sm text-gray-500 mt-0.5">Income, expenses & chart of accounts</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl border border-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Income</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary?.totalIncome ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl border border-red-100">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(summary?.totalExpenses ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl border', netProfit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100')}>
              <DollarSign className={cn('w-5 h-5', netProfit >= 0 ? 'text-blue-600' : 'text-orange-500')} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Profit</p>
              <p className={cn('text-xl font-bold', netProfit >= 0 ? 'text-blue-600' : 'text-orange-500')}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <>
          <div className="flex gap-1.5">
            {['all', 'income', 'expense'].map(f => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={cn('px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all',
                  typeFilter === f
                    ? f === 'income' ? 'bg-green-600 text-white'
                    : f === 'expense' ? 'bg-red-600 text-white'
                    : 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                {f}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <CustomTable
                isLoading={isLoading}
                emptyMessage="No transactions yet"
                columns={[
                  { key: 'date', label: 'Date', render: (v) => <span className="text-gray-600 text-xs">{formatDate(v)}</span> },
                  {
                    key: 'type',
                    label: 'Type',
                    render: (v) => (
                      <span className={cn('badge',
                        v === 'income' ? 'bg-green-100 text-green-700' :
                        v === 'expense' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      )}>{v}</span>
                    ),
                  },
                  { key: 'description', label: 'Description', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
                  { key: 'category', label: 'Category', render: (v) => <span className="text-gray-500">{v || '—'}</span> },
                  {
                    key: 'paymentMethod',
                    label: 'Method',
                    render: (v) => <span className="text-gray-500 capitalize text-xs">{v?.replace('_', ' ') || '—'}</span>,
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (v, t) => (
                      <span className={cn('font-semibold', t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-500' : 'text-gray-900')}>
                        {t.type === 'expense' ? '-' : ''}{formatCurrency(v)}
                      </span>
                    ),
                  },
                  {
                    key: 'id',
                    label: '',
                    render: (_, t) => (
                      <button onClick={() => { if (confirm('Delete this transaction?')) deleteMutation.mutate(t.id); }}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ),
                  },
                ]}
                data={transactions}
              />
            </div>
          </div>
        </>
      )}

      {/* Summary tab */}
      {tab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> Income Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Income</span>
                <span className="font-bold text-green-600">{formatCurrency(summary?.totalIncome ?? 0)}</span>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Expense Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-bold text-red-500">{formatCurrency(summary?.totalExpenses ?? 0)}</span>
              </div>
            </div>
          </div>
          <div className="card p-5 md:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Net Profit / Loss</h3>
              <span className={cn('text-2xl font-bold', netProfit >= 0 ? 'text-green-600' : 'text-red-500')}>
                {formatCurrency(Math.abs(netProfit))}
                <span className="text-sm font-normal ml-1">{netProfit >= 0 ? 'profit' : 'loss'}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Accounts tab */}
      {tab === 'accounts' && (
        <div className="card overflow-hidden">
          <CustomTable
            columns={[
              { key: 'code', label: 'Code', render: (v) => <span className="font-mono text-sm text-brand-600">{v}</span> },
              { key: 'name', label: 'Account Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
              {
                key: 'type',
                label: 'Type',
                render: (v) => (
                  <span className={cn('badge capitalize',
                    v === 'income' ? 'bg-green-100 text-green-700' :
                    v === 'expense' ? 'bg-red-100 text-red-700' :
                    v === 'asset' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  )}>{v}</span>
                ),
              },
              {
                key: 'isActive',
                label: 'Status',
                render: (v) => (
                  <span className={cn('badge', v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {v ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
            ]}
            data={accounts}
          />
        </div>
      )}

      {/* Transaction modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">New Transaction</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['income', 'expense'].map(t => (
                    <label key={t} className={cn(
                      'flex items-center justify-center p-2.5 border-2 rounded-lg cursor-pointer capitalize font-medium text-sm transition-all',
                      watchType === t
                        ? t === 'income' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}>
                      <input {...register('type')} type="radio" value={t} className="sr-only" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Description *</label>
                <input {...register('description', { required: true })} className="input" placeholder="e.g. Office rent for April" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (ZMW) *</label>
                  <input {...register('amount', { required: true })} type="number" step="0.01" min="0.01" className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input {...register('date', { required: true })} type="date" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select {...register('category')} className="input">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select {...register('paymentMethod')} className="input">
                  <option value="">Select...</option>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reference</label>
                <input {...register('reference')} className="input" placeholder="Receipt #, Invoice #, etc." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
