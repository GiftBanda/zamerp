'use client';

import { useCustomersPage } from '@/hooks/useCustomersPage';
import { Plus, Search, Edit2, Trash2, Mail, Phone, Building, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const {
    customers,
    isLoading,
    search,
    setSearch,
    modal,
    openCreate,
    openEdit,
    closeModal,
    deleteCustomer,
    register,
    handleSubmit,
    errors,
    onSubmit,
    isPending,
  } = useCustomersPage();

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} total customers</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Customer</th>
                <th className="table-th">Contact</th>
                <th className="table-th">City</th>
                <th className="table-th">TPIN</th>
                <th className="table-th">Status</th>
                <th className="table-th w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-td text-center text-gray-400 py-12">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.contactPerson && <p className="text-xs text-gray-400">{c.contactPerson}</p>}
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="space-y-0.5">
                        {c.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" /> {c.email}
                          </p>
                        )}
                        {c.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-gray-600">{c.city || '—'}</td>
                    <td className="table-td">
                      {c.tpin ? (
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.tpin}</span>
                      ) : '—'}
                    </td>
                    <td className="table-td">
                      <span className={cn('badge', c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deactivate this customer?')) {
                              deleteCustomer(c.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal.customer ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Company Name *</label>
                  <input {...register('name')} className="input" placeholder="Customer Ltd" />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...register('email')} type="email" className="input" placeholder="billing@company.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input {...register('phone')} className="input" placeholder="+260 97x xxx xxx" />
                </div>
                <div>
                  <label className="label">Contact Person</label>
                  <input {...register('contactPerson')} className="input" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input {...register('city')} className="input" placeholder="Lusaka" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input {...register('address')} className="input" placeholder="Plot 123, Cairo Road" />
                </div>
                <div className="col-span-2">
                  <label className="label">TPIN (ZRA Taxpayer ID)</label>
                  <input {...register('tpin')} className="input font-mono" placeholder="1234567890" />
                  <p className="mt-1 text-xs text-gray-400">Required for ZRA-compliant invoices</p>
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="Optional notes..." />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal.customer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
