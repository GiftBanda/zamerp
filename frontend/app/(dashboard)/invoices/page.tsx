'use client';

import { useInvoicesPage } from '@/hooks/useInvoicesPage';
import { formatCurrency, formatDate, STATUS_COLORS, cn } from '@/lib/utils';
import {
  Plus, FileText, Download, Send, CheckCircle, Ban,
  Eye, Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const {
    statuses,
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
  } = useInvoicesPage();

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">ZRA-compliant tax invoices</p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), color: 'text-green-600' },
          { label: 'Outstanding', value: formatCurrency(stats?.outstanding ?? 0), color: 'text-orange-600' },
          { label: 'Paid Invoices', value: stats?.paid ?? 0, color: 'text-green-600' },
          { label: 'Overdue', value: stats?.overdue ?? 0, color: stats?.overdue > 0 ? 'text-red-600' : 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all',
              status === s
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600',
            )}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Invoice #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Date</th>
                <th className="table-th">Due</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-16">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No invoices found
                    <div className="mt-2">
                      <Link href="/invoices/new" className="text-brand-600 text-sm hover:underline">
                        Create your first invoice →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="table-td">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-semibold text-brand-600 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                      {inv.zraInvoiceNumber && (
                        <p className="text-xs text-gray-400 font-mono">{inv.zraInvoiceNumber}</p>
                      )}
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{inv.customer?.name}</p>
                      {inv.customer?.tpin && (
                        <p className="text-xs text-gray-400 font-mono">TPIN: {inv.customer.tpin}</p>
                      )}
                    </td>
                    <td className="table-td text-gray-600 text-sm">{formatDate(inv.issueDate)}</td>
                    <td className="table-td">
                      {inv.dueDate ? (
                        <span className={cn('text-sm', new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'text-red-600 font-medium' : 'text-gray-600')}>
                          {formatDate(inv.dueDate)}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="table-td">
                      <p className="font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                      {Number(inv.vatAmount) > 0 && (
                        <p className="text-xs text-gray-400">VAT: {formatCurrency(inv.vatAmount)}</p>
                      )}
                    </td>
                    <td className="table-td">
                      <span className={cn('badge', STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600')}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <Link href={`/invoices/${inv.id}`}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDownloadPdf(inv)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Download PDF">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === 'draft' && (
                          <button onClick={() => sendMutation.mutate(inv.id)}
                            disabled={sendMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Mark as Sent">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(inv.status === 'sent' || inv.status === 'overdue') && (
                          <button onClick={() => openPayModal(inv)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Mark as Paid">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {inv.status !== 'void' && inv.status !== 'paid' && (
                          <button onClick={() => { if (confirm('Void this invoice?')) voidMutation.mutate(inv.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Void">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay modal */}
      {payModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePayModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Mark as Paid</h2>
            <p className="text-sm text-gray-500 mb-4">
              {payModal.invoice?.invoiceNumber} — {formatCurrency(payModal.invoice?.total)}
            </p>
            <div className="mb-4">
              <label className="label">Payment Method</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="input">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money (MTN/Airtel)</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 mb-4">
              ⚡ Inventory will be automatically deducted for all product line items.
            </div>
            <div className="flex gap-3">
              <button onClick={closePayModal} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={confirmPayment}
                disabled={payMutation.isPending}
                className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
              >
                {payMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
