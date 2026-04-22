'use client';

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
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Timestamp</th>
                <th className="table-th">User</th>
                <th className="table-th">Action</th>
                <th className="table-th">Resource</th>
                <th className="table-th">Details</th>
                <th className="table-th">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => (
                    <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-12">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />No audit logs yet
                </td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="table-td">
                    {log.user ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.user.firstName} {log.user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{log.user.email}</p>
                      </div>
                    ) : <span className="text-gray-400 text-xs">System</span>}
                  </td>
                  <td className="table-td">
                    <span className={cn('badge', actionColors[log.action] || 'bg-gray-100 text-gray-600')}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-td">
                    <div>
                      <span className="font-medium text-gray-900 capitalize">{log.resource}</span>
                      {log.resourceId && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[100px]">
                          {log.resourceId}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="table-td max-w-[200px]">
                    {log.metadata || log.newValues ? (
                      <pre className="text-xs text-gray-500 bg-gray-50 rounded p-1.5 overflow-hidden max-h-16 truncate">
                        {JSON.stringify(log.metadata || log.newValues, null, 1)}
                      </pre>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="table-td">
                    {log.ipAddress ? (
                      <span className="font-mono text-xs text-gray-500">{log.ipAddress}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
