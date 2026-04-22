import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  tpin: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export function useCustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; customer?: any }>({ open: false });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list(search || undefined),
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const closeModal = () => {
    setModal({ open: false });
    form.reset({});
  };

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deactivated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const openCreate = () => {
    form.reset({});
    setModal({ open: true });
  };

  const openEdit = (customer: any) => {
    form.reset(customer);
    setModal({ open: true, customer });
  };

  const onSubmit = (data: CustomerFormData) => {
    if (modal.customer) {
      updateMutation.mutate({ id: modal.customer.id, data });
      return;
    }

    createMutation.mutate(data);
  };

  return {
    customers,
    isLoading,
    search,
    setSearch,
    modal,
    openCreate,
    openEdit,
    closeModal,
    deleteCustomer: (customerId: string) => deleteMutation.mutate(customerId),
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    onSubmit,
    isPending: createMutation.isPending || updateMutation.isPending,
  };
}
