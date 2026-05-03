'use client';

import { CustomTable } from '@/components/CustomTable';
import { useAuditLogsPage } from '@/hooks/useAuditLogsPage';
import { formatDateTime, cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function AuditLogsPage() {
  const { actionColors, resources, resource, setResource, logs, isLoading } = useAuditLogsPage();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-50 rounded-xl border border-brand-100">
          <Shield className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete trail of all actions for compliance</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setResource('')}
          className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            resource === '' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          )}>
          All
        </button>
        {resources.map(r => (
          <button key={r} onClick={() => setResource(r)}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all',
              resource === r ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            )}>
            {r}
          </button>
        ))}
      </div>

      {/* Stats banner */}
      <div className="card p-4 flex items-center justify-between bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          Showing <strong>{logs.length}</strong> audit events. All data mutations are permanently logged.
        </p>
        <span className="text-xs text-blue-500 font-medium bg-blue-100 px-2 py-1 rounded-full">
          Tamper-proof log
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">

          <CustomTable
            isLoading={isLoading}
            emptyMessage="No audit logs yet"
            columns={[
              {
                key: 'createdAt',
                label: 'Timestamp',
                render: (v) => (
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(v)}</span>
                ),
              },
              {
                key: 'user',
                label: 'User',
                render: (v) =>
                  v ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.firstName} {v.lastName}</p>
                      <p className="text-xs text-gray-400">{v.email}</p>
                    </div>
                  ) : <span className="text-gray-400 text-xs">System</span>,
              },
              {
                key: 'action',
                label: 'Action',
                render: (v) => (
                  <span className={cn('badge', actionColors[v] || 'bg-gray-100 text-gray-600')}>{v}</span>
                ),
              },
              {
                key: 'resource',
                label: 'Resource',
                render: (v, row) => (
                  <div>
                    <span className="font-medium text-gray-900 capitalize">{v}</span>
                    {row.resourceId && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[100px]">{row.resourceId}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'metadata',
                label: 'Details',
                render: (v, row) =>
                  v || row.newValues ? (
                    <pre className="text-xs text-gray-500 bg-gray-50 rounded p-1.5 overflow-hidden max-h-16 truncate">
                      {JSON.stringify(v || row.newValues, null, 1)}
                    </pre>
                  ) : <span className="text-gray-400">—</span>,
              },
              {
                key: 'ipAddress',
                label: 'IP Address',
                render: (v) =>
                  v ? <span className="font-mono text-xs text-gray-500">{v}</span>
                    : <span className="text-gray-400">—</span>,
              },
            ]}
            data={logs}
          />
        </div>
      </div>
    </div>
  );
}
