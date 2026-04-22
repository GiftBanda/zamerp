import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { inventoryApi } from '@/lib/api';

export function useInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'products' | 'movements'>('products');
  const [productModal, setProductModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; product?: any }>({ open: false });

  const { data: stats } = useQuery({ queryKey: ['inventory-stats'], queryFn: inventoryApi.stats });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => inventoryApi.products({ search: search || undefined }),
  });
  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => inventoryApi.movements(),
    enabled: tab === 'movements',
  });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: inventoryApi.categories });

  const createMutation = useMutation({
    mutationFn: inventoryApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      setProductModal({ open: false });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => inventoryApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
      setProductModal({ open: false });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: any) => inventoryApi.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Stock adjusted');
      setAdjustModal({ open: false });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const prodForm = useForm<any>();
  const adjForm = useForm<any>({ defaultValues: { type: 'in' } });

  const onProductSubmit = (data: any) => {
    const payload = {
      ...data,
      costPrice: parseFloat(data.costPrice),
      sellingPrice: parseFloat(data.sellingPrice),
      reorderLevel: parseFloat(data.reorderLevel || '0'),
    };

    if (productModal.product) {
      updateMutation.mutate({ id: productModal.product.id, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const onAdjustSubmit = (data: any) => {
    adjustMutation.mutate({
      id: adjustModal.product.id,
      data: { ...data, quantity: parseFloat(data.quantity) },
    });
  };

  const openEdit = (product: any) => {
    prodForm.reset(product);
    setProductModal({ open: true, product });
  };

  const openCreate = () => {
    prodForm.reset({});
    setProductModal({ open: true });
  };

  const openAdjust = (product: any) => {
    adjForm.reset({ type: 'in' });
    setAdjustModal({ open: true, product });
  };

  return {
    stats,
    products,
    isLoading,
    movements,
    categories,
    search,
    setSearch,
    tab,
    setTab,
    productModal,
    setProductModal,
    adjustModal,
    setAdjustModal,
    prodForm,
    adjForm,
    onProductSubmit,
    onAdjustSubmit,
    openEdit,
    openCreate,
    openAdjust,
    isProductPending: createMutation.isPending || updateMutation.isPending,
    isAdjustPending: adjustMutation.isPending,
  };
}
