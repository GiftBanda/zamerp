import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  EXPORT: 'bg-orange-100 text-orange-700',
  VIEW: 'bg-gray-100 text-gray-500',
};

const RESOURCES = ['invoices', 'customers', 'products', 'transactions', 'users', 'tenants', 'auth'];

export function useAuditLogsPage() {
  const [resource, setResource] = useState('');
  const limit = 100;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', resource],
    queryFn: () => auditApi.list({ resource: resource || undefined, limit }),
  });

  return {
    actionColors: ACTION_COLORS,
    resources: RESOURCES,
    resource,
    setResource,
    logs,
    isLoading,
  };
}
