import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { customersApi, inventoryApi, invoicesApi } from '@/lib/api';

interface LineItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
}

interface InvoiceFormData {
  customerId: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  terms: string;
  discountPercent: number;
  items: LineItem[];
}

const DEFAULT_ITEM: LineItem = {
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  vatRate: 16,
};

export function useNewInvoicePage() {
  const router = useRouter();

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.list() });
  const { data: products = [] } = useQuery({ queryKey: ['products-all'], queryFn: () => inventoryApi.products() });

  const createMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoiceNumber} created`);
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create invoice'),
  });

  const form = useForm<InvoiceFormData>({
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      discountPercent: 0,
      items: [{ ...DEFAULT_ITEM }],
    },
  });

  const fieldArray = useFieldArray({ control: form.control, name: 'items' });
  const watchedItems = form.watch('items');
  const watchedDiscount = form.watch('discountPercent') || 0;

  const onProductSelect = (idx: number, productId: string) => {
    const product = products.find((item: any) => item.id === productId);
    if (!product) {
      return;
    }

    form.setValue(`items.${idx}.description`, product.name);
    form.setValue(`items.${idx}.unitPrice`, parseFloat(product.sellingPrice));
    form.setValue(`items.${idx}.vatRate`, product.vatExempt ? 0 : 16);
  };

  const calcItem = (item: LineItem) => {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
    const lineDiscount = lineTotal * ((item.discountPercent || 0) / 100);
    const net = lineTotal - lineDiscount;
    const vat = net * ((item.vatRate ?? 16) / 100);
    return { net, vat, total: net + vat };
  };

  const subtotal = watchedItems?.reduce((sum, item) => sum + calcItem(item).net, 0) || 0;
  const vatTotal = watchedItems?.reduce((sum, item) => sum + calcItem(item).vat, 0) || 0;
  const discountAmount = subtotal * (watchedDiscount / 100);
  const grandTotal = subtotal - discountAmount + vatTotal;

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate({
      ...data,
      discountPercent: Number(data.discountPercent),
      items: data.items.map((item) => ({
        ...item,
        productId: item.productId || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPercent: Number(item.discountPercent),
        vatRate: Number(item.vatRate),
      })),
    });
  };

  return {
    router,
    customers,
    products,
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    fields: fieldArray.fields,
    remove: fieldArray.remove,
    addLineItem: () => fieldArray.append({ ...DEFAULT_ITEM }),
    watchedItems,
    onProductSelect,
    calcItem,
    subtotal,
    vatTotal,
    discountAmount,
    grandTotal,
    onSubmit,
    isPending: createMutation.isPending,
  };
}
