import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { tenantsApi, usersApi } from '@/lib/api';

const TABS = ['company', 'users'] as const;
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

  const { data: tenant } = useQuery({ queryKey: ['tenant-me'], queryFn: tenantsApi.me });
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: usersApi.list,
    enabled: tab === 'users',
  });

  const tenantForm = useForm<any>({ values: tenant });
  const userForm = useForm<any>({ defaultValues: { role: 'staff' } });

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
    updateTenantMutation,
    createUserMutation,
    updateUserMutation,
    openUserModal,
  };
}
