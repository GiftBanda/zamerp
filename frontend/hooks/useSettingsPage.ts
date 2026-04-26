import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { tenantsApi, usersApi, zraApi } from '@/lib/api';

const TABS = ['company', 'users', 'zra'] as const;
type Tab = typeof TABS[number];

const ROLES = ['admin', 'staff', 'accountant', 'viewer'];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  staff: 'bg-blue-100 text-blue-700',
  accountant: 'bg-purple-100 text-purple-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export function useSettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('company');
  const [userModal, setUserModal] = useState(false);
  const [zraPreviewResult, setZraPreviewResult] = useState<any>(null);
  const [zraTestResult, setZraTestResult] = useState<any>(null);

  const { data: tenant } = useQuery({ queryKey: ['tenant-me'], queryFn: tenantsApi.me });
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: usersApi.list,
    enabled: tab === 'users',
  });
  const { data: zraCurrentCodes, refetch: refetchZraCurrentCodes } = useQuery({
    queryKey: ['zra-current-codes'],
    queryFn: zraApi.currentCodes,
    enabled: tab === 'zra',
  });

  const tenantForm = useForm<any>({ values: tenant });
  const userForm = useForm<any>({ defaultValues: { role: 'staff' } });
  const zraForm = useForm<any>({
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-00001`,
      issueDate: new Date().toISOString().slice(0, 10),
      subtotal: 100,
      vatAmount: 16,
      total: 116,
      description: 'Test Item',
      quantity: 1,
      unitPrice: 100,
      itemTotal: 116,
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: tenantsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      toast.success('Company settings saved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User created');
      setUserModal(false);
      userForm.reset({});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: any) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User updated');
    },
  });

  const syncZraCodesMutation = useMutation({
    mutationFn: zraApi.syncCodeTables,
    onSuccess: async () => {
      toast.success('ZRA code tables synced');
      await refetchZraCurrentCodes();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Code sync failed'),
  });

  const previewZraSaleMutation = useMutation({
    mutationFn: zraApi.previewSale,
    onSuccess: (data: any) => {
      setZraPreviewResult(data);
      toast.success('ZRA preview generated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Preview failed'),
  });

  const testZraSaleMutation = useMutation({
    mutationFn: zraApi.testSale,
    onSuccess: (data: any) => {
      setZraTestResult(data);
      toast.success(data?.success ? 'ZRA test sale submitted' : 'ZRA test sale failed');
      refetchZraCurrentCodes();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Test sale failed'),
  });

  const buildZraSource = (data: any) => ({
    invoiceNumber: data.invoiceNumber,
    issueDate: data.issueDate,
    subtotal: Number(data.subtotal),
    vatAmount: Number(data.vatAmount),
    total: Number(data.total),
    items: [
      {
        description: data.description,
        quantity: Number(data.quantity),
        unitPrice: Number(data.unitPrice),
        vatAmount: Number(data.vatAmount),
        total: Number(data.itemTotal),
      },
    ],
  });

  const runZraPreview = (data: any) => {
    setZraPreviewResult(null);
    previewZraSaleMutation.mutate(buildZraSource(data));
  };

  const runZraTest = (data: any) => {
    setZraTestResult(null);
    testZraSaleMutation.mutate(buildZraSource(data));
  };

  const openUserModal = () => {
    userForm.reset({ role: 'staff' });
    setUserModal(true);
  };

  return {
    tabs: TABS,
    roles: ROLES,
    roleColors: ROLE_COLORS,
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
    syncZraCodesMutation,
    previewZraSaleMutation,
    testZraSaleMutation,
    zraCurrentCodes,
    zraPreviewResult,
    zraTestResult,
    runZraPreview,
    runZraTest,
    openUserModal,
  };
}
