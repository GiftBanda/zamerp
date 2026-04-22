'use client';

import { useNewInvoicePage } from '@/hooks/useNewInvoicePage';
import { formatCurrency } from '@/lib/utils';
import {
  Plus, Trash2, ChevronLeft, Loader2, Save,
} from 'lucide-react';

export default function NewInvoicePage() {
  const {
    router,
    customers,
    products,
    register,
    handleSubmit,
    errors,
    fields,
    remove,
    addLineItem,
    watchedItems,
    onProductSelect,
    calcItem,
    subtotal,
    vatTotal,
    discountAmount,
    grandTotal,
    onSubmit,
    isPending,
  } = useNewInvoicePage();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-1.5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-sm text-gray-500 mt-0.5">ZRA-ready tax invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main form area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer & dates */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Invoice Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Customer *</label>
                  <select {...register('customerId', { required: 'Customer required' })} className="input">
                    <option value="">Select customer...</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>}
                </div>
                <div>
                  <label className="label">Issue Date</label>
                  <input {...register('issueDate')} type="date" className="input" />
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input {...register('dueDate')} type="date" className="input" />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Line Items</h2>

              {/* Items header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">Disc%</div>
                <div className="col-span-1 text-right">VAT%</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {fields.map((field, idx) => {
                const item = watchedItems?.[idx];
                const { total } = item ? calcItem(item) : { total: 0 };
                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Product selector */}
                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                      <select
                        className="input text-xs"
                        {...register(`items.${idx}.productId`, {
                          onChange: (e) => onProductSelect(idx, e.target.value),
                        })}
                      >
                        <option value="">— Select product or type below —</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.sellingPrice)})</option>
                        ))}
                      </select>
                      <input
                        {...register(`items.${idx}.description`, { required: true })}
                        placeholder="Description *"
                        className="input text-sm"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="sm:hidden label text-xs">Qty</label>
                      <input
                        {...register(`items.${idx}.quantity`, { required: true, min: 0.001 })}
                        type="number" step="0.01" min="0.001"
                        className="input text-sm text-right"
                        placeholder="1"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="sm:hidden label text-xs">Unit Price</label>
                      <input
                        {...register(`items.${idx}.unitPrice`, { required: true, min: 0 })}
                        type="number" step="0.01" min="0"
                        className="input text-sm text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="sm:hidden label text-xs">Disc%</label>
                      <input
                        {...register(`items.${idx}.discountPercent`)}
                        type="number" step="0.1" min="0" max="100"
                        className="input text-sm text-right"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="sm:hidden label text-xs">VAT%</label>
                      <input
                        {...register(`items.${idx}.vatRate`)}
                        type="number" step="0.1" min="0"
                        className="input text-sm text-right"
                        placeholder="16"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                      <span className="text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(idx)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addLineItem}
                className="btn-secondary w-full text-sm py-2"
              >
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </div>

            {/* Notes & Terms */}
            <div className="card p-5 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Notes (visible on invoice)</label>
                <textarea {...register('notes')} className="input resize-none" rows={3} placeholder="Thank you for your business!" />
              </div>
              <div>
                <label className="label">Terms & Conditions</label>
                <textarea {...register('terms')} className="input resize-none" rows={3} placeholder="Payment due within 30 days." />
              </div>
            </div>
          </div>

          {/* Sidebar: totals + actions */}
          <div className="space-y-4">
            {/* Totals */}
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Discount</span>
                    <div className="flex items-center gap-1">
                      <input
                        {...register('discountPercent')}
                        type="number" step="0.1" min="0" max="100"
                        className="w-16 input text-sm py-0.5 px-2"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                  <span className="text-red-500">-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT</span>
                  <span>{formatCurrency(vatTotal)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-base text-gray-900">
                  <span>Total (ZMW)</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* ZRA info */}
            <div className="card p-4 bg-green-50 border-green-200">
              <div className="flex gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">✓</div>
                <div>
                  <p className="text-sm font-medium text-green-800">ZRA-Ready Invoice</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    A ZRA fiscal invoice number and verification code will be automatically generated.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full py-2.5"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isPending ? 'Creating...' : 'Create Invoice'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary w-full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
