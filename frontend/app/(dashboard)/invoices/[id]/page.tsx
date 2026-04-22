'use client';

import { useInvoiceDetailPage } from '@/hooks/useInvoiceDetailPage';
import { formatCurrency, formatDate, STATUS_COLORS, PAYMENT_METHODS, cn } from '@/lib/utils';
import {
  ChevronLeft, Download, Send, CheckCircle, Ban, FileText, Loader2,
  Building2, User, Calendar, Hash, ShieldCheck,
} from 'lucide-react';

export default function InvoiceDetailPage() {
  const {
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
  } = useInvoiceDetailPage();

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  if (!invoice) return (
    <div className="p-6 text-center text-gray-500">Invoice not found</div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-1.5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <span className={cn('badge mt-1', STATUS_COLORS[invoice.status] || '')}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="btn-secondary gap-1.5">
            <Download className="w-4 h-4" /> PDF
          </button>
          {invoice.status === 'draft' && (
            <button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending} className="btn-secondary">
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button onClick={() => setPayModal(true)} className="btn-primary bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4" /> Mark Paid
            </button>
          )}
          {invoice.status !== 'void' && invoice.status !== 'paid' && (
            <button onClick={() => { if (confirm('Void this invoice?')) voidMutation.mutate(); }}
              className="btn-danger">
              <Ban className="w-4 h-4" /> Void
            </button>
          )}
        </div>
      </div>

      {/* ZRA Badge */}
      <div className="card p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">ZRA FISCAL INVOICE NO.</p>
              <p className="font-mono font-bold text-green-800">{invoice.zraInvoiceNumber || 'N/A'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">VERIFICATION CODE</p>
            <p className="font-mono font-bold text-green-800">{invoice.zraVerificationCode || 'N/A'}</p>
          </div>
          {invoice.tenant?.tpin && (
            <div>
              <p className="text-xs text-green-600 font-medium">SUPPLIER TPIN</p>
              <p className="font-mono font-bold text-green-800">{invoice.tenant.tpin}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* From */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From</p>
          </div>
          <p className="font-bold text-gray-900">{invoice.tenant?.name}</p>
          {invoice.tenant?.address && <p className="text-sm text-gray-600 mt-1">{invoice.tenant.address}</p>}
          {invoice.tenant?.phone && <p className="text-sm text-gray-600">{invoice.tenant.phone}</p>}
          {invoice.tenant?.email && <p className="text-sm text-gray-600">{invoice.tenant.email}</p>}
          {invoice.tenant?.tpin && (
            <p className="text-xs text-gray-500 mt-2 font-mono">TPIN: {invoice.tenant.tpin}</p>
          )}
          {invoice.tenant?.vrn && (
            <p className="text-xs text-gray-500 font-mono">VRN: {invoice.tenant.vrn}</p>
          )}
        </div>

        {/* To */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bill To</p>
          </div>
          <p className="font-bold text-gray-900">{invoice.customer?.name}</p>
          {invoice.customer?.address && <p className="text-sm text-gray-600 mt-1">{invoice.customer.address}</p>}
          {invoice.customer?.phone && <p className="text-sm text-gray-600">{invoice.customer.phone}</p>}
          {invoice.customer?.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
          {invoice.customer?.tpin && (
            <p className="text-xs text-gray-500 mt-2 font-mono">TPIN: {invoice.customer.tpin}</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Invoice No.', value: invoice.invoiceNumber, icon: <Hash className="w-4 h-4" /> },
          { label: 'Issue Date', value: formatDate(invoice.issueDate), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Due Date', value: invoice.dueDate ? formatDate(invoice.dueDate) : '—', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Payment', value: invoice.paymentMethod?.replace('_', ' ') || '—', icon: <FileText className="w-4 h-4" /> },
        ].map(item => (
          <div key={item.label}>
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              {item.icon}
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
            </div>
            <p className="font-semibold text-gray-900 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Line Items</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Description</th>
              <th className="table-th text-right">Qty</th>
              <th className="table-th text-right">Unit Price</th>
              <th className="table-th text-right">Disc%</th>
              <th className="table-th text-right">VAT%</th>
              <th className="table-th text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  {item.product && <p className="text-xs text-gray-400">SKU: {item.product.sku || 'N/A'}</p>}
                </td>
                <td className="table-td text-right">{Number(item.quantity)}</td>
                <td className="table-td text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="table-td text-right">{Number(item.discountPercent)}%</td>
                <td className="table-td text-right">{Number(item.vatRate)}%</td>
                <td className="table-td text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end p-5">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount ({invoice.discountPercent}%)</span>
                <span>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT</span><span>{formatCurrency(invoice.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
              <span>Total (ZMW)</span><span>{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.status === 'paid' && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Amount Paid</span><span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {invoice.notes && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Terms & Conditions</p>
              <p className="text-sm text-gray-600">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h2>
            <div className="mb-4">
              <label className="label">Payment Method</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input">
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending}
                className="btn-primary flex-1 bg-green-600 hover:bg-green-700">
                {payMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
