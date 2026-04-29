import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { inventoryApi } from '@/lib/api';

export function useInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'products' | 'movements' | 'categories'>('products');
  const [productModal, setProductModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: any }>({ open: false });

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

  const createCategoryMutation = useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Category created');
      setCategoryModal({ open: false });
      categoryForm.reset({});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create category'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: any) => inventoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
      setCategoryModal({ open: false });
      categoryForm.reset({});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update category'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: inventoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Category deleted');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete category'),
  });

  const prodForm = useForm<any>();
  const adjForm = useForm<any>({ defaultValues: { type: 'in' } });
  const categoryForm = useForm<any>();

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

  const onCategorySubmit = (data: any) => {
    const payload = {
      name: data.name?.trim(),
      description: data.description?.trim() || undefined,
    };

    if (categoryModal.category) {
      updateCategoryMutation.mutate({ id: categoryModal.category.id, data: payload });
      return;
    }

    createCategoryMutation.mutate(payload);
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

  const openCategoryCreate = () => {
    categoryForm.reset({});
    setCategoryModal({ open: true });
  };

  const openCategoryEdit = (category: any) => {
    categoryForm.reset({
      name: category.name || '',
      description: category.description || '',
    });
    setCategoryModal({ open: true, category });
  };

  const deleteCategory = (category: any) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete category "${category.name}"?`);
      if (!confirmed) return;
    }
    deleteCategoryMutation.mutate(category.id);
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
    categoryModal,
    setCategoryModal,
    prodForm,
    adjForm,
    categoryForm,
    onProductSubmit,
    onAdjustSubmit,
    onCategorySubmit,
    openEdit,
    openCreate,
    openAdjust,
    openCategoryCreate,
    openCategoryEdit,
    deleteCategory,
    isProductPending: createMutation.isPending || updateMutation.isPending,
    isAdjustPending: adjustMutation.isPending,
    isCategoryPending: createCategoryMutation.isPending || updateCategoryMutation.isPending,
    isCategoryDeletePending: deleteCategoryMutation.isPending,
  };
}
