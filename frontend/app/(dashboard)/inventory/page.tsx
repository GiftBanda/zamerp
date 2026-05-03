'use client';

import { CustomTable } from '@/components/CustomTable';
import { useInventoryPage } from '@/hooks/useInventoryPage';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Plus, Search, Edit2, Package, AlertTriangle, TrendingUp,
  Sliders, X, Loader2, ArrowUpCircle, ArrowDownCircle, Tags, Trash2,
} from 'lucide-react';

export default function InventoryPage() {
  const {
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
    isProductPending,
    isAdjustPending,
    isCategoryPending,
  } = useInventoryPage();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCategoryCreate} className="btn-secondary">
            <Tags className="w-4 h-4" /> Add Category
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats?.activeProducts ?? 0, icon: <Package className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Stock Value', value: formatCurrency(stats?.totalValue ?? 0), icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
          { label: 'Low Stock', value: stats?.lowStockCount ?? 0, icon: <AlertTriangle className="w-4 h-4" />, color: stats?.lowStockCount > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50' },
          { label: 'Categories', value: categories.length, icon: <Sliders className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', s.color)}>{s.icon}</div>
            <div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['products', 'categories', 'movements'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {t === 'movements' ? 'Stock Movements' : t === 'categories' ? 'Categories' : 'Products'}
          </button>
        ))}
      </div>

      {/* Search (products tab) */}
      {tab === 'products' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9" />
        </div>
      )}

      {/* Products table */}
      {tab === 'products' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <CustomTable
              isLoading={isLoading}
              emptyMessage={<><Package className="w-8 h-8 mx-auto mb-2 opacity-40" />No products found</>}
              columns={[
                {
                  key: 'name',
                  label: 'Product',
                  render: (_, p) => {
                    const lowStock = Number(p.quantityOnHand) <= Number(p.reorderLevel);
                    return (
                      <div className={cn(lowStock && 'text-red-900')}>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                      </div>
                    );
                  },
                },
                {
                  key: 'sku',
                  label: 'SKU',
                  render: (v) => v
                    ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</span>
                    : '—',
                },
                { key: 'costPrice', label: 'Cost', render: (v) => <span className="text-gray-600">{formatCurrency(v)}</span> },
                { key: 'sellingPrice', label: 'Sell Price', render: (v) => <span className="font-medium text-gray-900">{formatCurrency(v)}</span> },
                {
                  key: 'quantityOnHand',
                  label: 'Stock',
                  render: (v, p) => {
                    const lowStock = Number(v) <= Number(p.reorderLevel);
                    return (
                      <div>
                        <div className="flex items-center gap-1.5">
                          {lowStock && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          <span className={cn('font-semibold', lowStock ? 'text-red-600' : 'text-gray-900')}>
                            {Number(v).toFixed(0)} {p.unit}
                          </span>
                        </div>
                        {lowStock && <p className="text-xs text-red-400">Reorder at {p.reorderLevel}</p>}
                      </div>
                    );
                  },
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
                  key: 'id',
                  label: 'Actions',
                  render: (_, p) => (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openAdjust(p)} title="Adjust stock" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={products}
            />
          </div>
        </div>
      )}

      {/* Movements table */}
      {tab === 'movements' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <CustomTable
              emptyMessage="No movements recorded"
              columns={[
                { key: 'product', label: 'Product', render: (v) => <span className="font-medium text-gray-900">{v?.name}</span> },
                {
                  key: 'type',
                  label: 'Type',
                  render: (v) => (
                    <span className={cn('badge flex items-center gap-1 w-fit',
                      v === 'in' ? 'bg-green-100 text-green-700' :
                      v === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {v === 'in' ? <ArrowUpCircle className="w-3 h-3" /> : v === 'out' ? <ArrowDownCircle className="w-3 h-3" /> : null}
                      {v}
                    </span>
                  ),
                },
                { key: 'quantity', label: 'Qty', render: (v) => <span className="font-semibold text-gray-900">{Number(v).toFixed(2)}</span> },
                { key: 'balanceBefore', label: 'Before', render: (v) => <span className="text-gray-500">{Number(v || 0).toFixed(2)}</span> },
                { key: 'balanceAfter', label: 'After', render: (v) => <span className="text-gray-900">{Number(v || 0).toFixed(2)}</span> },
                {
                  key: 'reference',
                  label: 'Reference',
                  render: (v) => v ? <span className="font-mono text-xs text-blue-600">{v}</span> : '—',
                },
                {
                  key: 'createdAt',
                  label: 'Date',
                  render: (v) => <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString('en-ZM')}</span>,
                },
              ]}
              data={movements}
            />
          </div>
        </div>
      )}

      {/* Categories table */}
      {tab === 'categories' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <CustomTable
              emptyMessage={<><Tags className="w-8 h-8 mx-auto mb-2 opacity-40" />No categories found</>}
              columns={[
                {
                  key: 'name',
                  label: 'Category',
                  render: (v) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Tags className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{v}</p>
                        <p className="text-xs text-gray-400">Inventory category</p>
                      </div>
                    </div>
                  ),
                },
                { key: 'description', label: 'Description', render: (v) => <span className="text-gray-600">{v || 'No description'}</span> },
                {
                  key: 'createdAt',
                  label: 'Created',
                  render: (v) => (
                    <span className="text-gray-500 text-sm">
                      {v ? new Date(v).toLocaleDateString('en-ZM') : '—'}
                    </span>
                  ),
                },
                {
                  key: 'id',
                  label: 'Actions',
                  render: (_, category) => (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openCategoryEdit(category)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="Edit category">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCategory(category)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete category">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={categories}
            />
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModal.open && (
        <Modal title={productModal.product ? 'Edit Product' : 'Add Product'} onClose={() => setProductModal({ open: false })}>
          <form onSubmit={prodForm.handleSubmit(onProductSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input {...prodForm.register('name', { required: true })} className="input" placeholder="Product name" />
              </div>
              <div>
                <label className="label">SKU</label>
                <input {...prodForm.register('sku')} className="input font-mono" placeholder="PRD-001" />
              </div>
              <div>
                <label className="label">Unit</label>
                <select {...prodForm.register('unit')} className="input">
                  {['item', 'kg', 'litre', 'box', 'pair', 'set', 'metre', 'pack'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cost Price (ZMW) *</label>
                <input {...prodForm.register('costPrice', { required: true })} type="number" step="0.01" className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Selling Price (ZMW) *</label>
                <input {...prodForm.register('sellingPrice', { required: true })} type="number" step="0.01" className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Reorder Level</label>
                <input {...prodForm.register('reorderLevel')} type="number" step="0.01" className="input" placeholder="10" />
              </div>
              <div>
                <label className="label">Category</label>
                <select {...prodForm.register('categoryId')} className="input">
                  <option value="">No category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea {...prodForm.register('description')} className="input resize-none" rows={2} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input {...prodForm.register('vatExempt')} type="checkbox" id="vatExempt" className="w-4 h-4 text-brand-600" />
                <label htmlFor="vatExempt" className="text-sm text-gray-700">VAT Exempt</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setProductModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isProductPending} className="btn-primary flex-1">
                {isProductPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {productModal.product ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust stock modal */}
      {adjustModal.open && (
        <Modal title={`Adjust Stock: ${adjustModal.product?.name}`} onClose={() => setAdjustModal({ open: false })}>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-500">Current stock</p>
            <p className="text-2xl font-bold text-gray-900">
              {Number(adjustModal.product?.quantityOnHand || 0).toFixed(2)} {adjustModal.product?.unit}
            </p>
          </div>
          <form onSubmit={adjForm.handleSubmit(onAdjustSubmit)} className="space-y-4">
            <div>
              <label className="label">Movement Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'in', label: 'Stock In', color: 'border-green-400 bg-green-50 text-green-700' },
                  { value: 'out', label: 'Stock Out', color: 'border-red-400 bg-red-50 text-red-700' },
                  { value: 'adjustment', label: 'Set Absolute', color: 'border-blue-400 bg-blue-50 text-blue-700' },
                ].map(opt => (
                  <label key={opt.value} className={cn(
                    'flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all text-sm font-medium',
                    adjForm.watch('type') === opt.value ? opt.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}>
                    <input {...adjForm.register('type')} type="radio" value={opt.value} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input {...adjForm.register('quantity', { required: true })} type="number" step="0.001" min="0.001" className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="label">Reference / Notes</label>
              <input {...adjForm.register('reference')} className="input" placeholder="PO-001 or manual adjustment" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAdjustModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isAdjustPending} className="btn-primary flex-1">
                {isAdjustPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {categoryModal.open && (
        <Modal
          title={categoryModal.category ? 'Edit Category' : 'Create Category'}
          onClose={() => setCategoryModal({ open: false })}
        >
          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
            <div>
              <label className="label">Category Name *</label>
              <input
                {...categoryForm.register('name', { required: true })}
                className="input"
                placeholder="Office Supplies"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                {...categoryForm.register('description')}
                className="input resize-none"
                rows={3}
                placeholder="Short note about what belongs in this category"
              />
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
              New categories will be available immediately when creating or editing products.
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCategoryModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isCategoryPending} className="btn-primary flex-1">
                {isCategoryPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {categoryModal.category ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
      ))}
    </tr>
  );
}
