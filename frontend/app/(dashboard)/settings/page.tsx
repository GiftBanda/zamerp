'use client';

import { CustomTable } from '@/components/CustomTable';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import { formatDate, cn } from '@/lib/utils';
import { Save, Plus, Loader2, X, Users, Building2, RefreshCw, Eye, Send } from 'lucide-react';

export default function SettingsPage() {
  const {
    tabs,
    roles,
    roleColors,
    tab,
    setTab,
    userModal,
    setUserModal,
    users,
    tenantForm,
    userForm,
    zraForm,
    updateTenantMutation,
    createUserMutation,
    updateUserMutation,
    openUserModal,
  } = useSettingsPage();

  const { register, handleSubmit } = tenantForm;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Company profile & user management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {t === 'company' ? 'Company Profile' : t === 'users' ? 'Users & Access' : 'ZRA Admin'}
          </button>
        ))}
      </div>

      {/* Company profile */}
      {tab === 'company' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-900">Company Profile</h2>
          </div>
          <form onSubmit={handleSubmit(data => updateTenantMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input {...register('name')} className="input" placeholder="Your Company Ltd" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">TPIN (ZRA Taxpayer ID)</label>
                <input {...register('tpin')} className="input font-mono" placeholder="1234567890" />
              </div>
              <div>
                <label className="label">VRN (VAT Registration)</label>
                <input {...register('vrn')} className="input font-mono" placeholder="987654321" />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input {...register('address')} className="input" placeholder="Plot 123, Cairo Road" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input {...register('city')} className="input" placeholder="Lusaka" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} className="input" placeholder="+260 211 xxxxxx" />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="accounts@company.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <input {...register('currency')} className="input" defaultValue="ZMW" />
              </div>
              <div>
                <label className="label">VAT Rate (%)</label>
                <input {...register('vatRate')} type="number" step="0.1" className="input" placeholder="16" />
              </div>
            </div>

            {/* ZRA info box */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <p className="font-semibold mb-1">ZRA Compliance</p>
              <p>Your TPIN and VRN will appear on all generated invoices. Ensure these match your ZRA registration exactly.</p>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={updateTenantMutation.isPending} className="btn-primary">
                {updateTenantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{users.length} users</span>
            </div>
            <button onClick={openUserModal} className="btn-primary">
              <Plus className="w-4 h-4" /> Invite User
            </button>
          </div>

          <div className="card overflow-hidden">
            <CustomTable
              columns={[
                {
                  key: 'firstName',
                  label: 'User',
                  render: (_, u) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  label: 'Role',
                  render: (v) => (
                    <span className={cn('badge capitalize', roleColors[v] || 'bg-gray-100 text-gray-600')}>{v}</span>
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
                {
                  key: 'lastLoginAt',
                  label: 'Last Login',
                  render: (v) => <span className="text-gray-500 text-sm">{v ? formatDate(v) : 'Never'}</span>,
                },
                {
                  key: 'id',
                  label: 'Actions',
                  render: (_, u) => (
                    <select
                      defaultValue={u.role}
                      onChange={e => updateUserMutation.mutate({ id: u.id, data: { role: e.target.value } })}
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none focus:border-brand-400"
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ),
                },
              ]}
              data={users}
            />
          </div>

          {/* Role permissions guide */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Role Permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left">
                  <th className="pb-2 font-medium text-gray-500">Permission</th>
                  {roles.map(r => <th key={r} className="pb-2 font-medium text-gray-500 capitalize text-center">{r}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Create/Edit Invoices', true, true, true, false],
                    ['Create/Edit Customers', true, true, false, false],
                    ['Manage Inventory', true, true, false, false],
                    ['Record Transactions', true, true, true, false],
                    ['View Reports', true, true, true, true],
                    ['Mark Invoices Paid', true, false, true, false],
                    ['Manage Users', true, false, false, false],
                    ['View Audit Logs', true, false, true, false],
                    ['Company Settings', true, false, false, false],
                  ].map(([label, ...perms]) => (
                    <tr key={label as string}>
                      <td className="py-2 text-gray-700">{label}</td>
                      {perms.map((p, i) => (
                        <td key={i} className="py-2 text-center">
                          {p ? <span className="text-green-500">✓</span> : <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Invite Team Member</h2>
              <button onClick={() => setUserModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={userForm.handleSubmit(data => createUserMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input {...userForm.register('firstName', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input {...userForm.register('lastName', { required: true })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input {...userForm.register('email', { required: true })} type="email" className="input" />
              </div>
              <div>
                <label className="label">Temporary Password *</label>
                <input {...userForm.register('password', { required: true, minLength: 8 })} type="password" className="input" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="label">Role *</label>
                <select {...userForm.register('role')} className="input">
                  {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setUserModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createUserMutation.isPending} className="btn-primary flex-1">
                  {createUserMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
