import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('zamerp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('zamerp_token');
      Cookies.remove('zamerp_user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Auth ───────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string; tenantSlug: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  register: (data: any) => api.post('/auth/register', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
};

// ── Customers ──────────────────────────────────────────
export const customersApi = {
  list: (search?: string) =>
    api.get('/customers', { params: { search } }).then(r => r.data),
  stats: () => api.get('/customers/stats').then(r => r.data),
  get: (id: string) => api.get(`/customers/${id}`).then(r => r.data),
  create: (data: any) => api.post('/customers', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`).then(r => r.data),
};

// ── Inventory ──────────────────────────────────────────
export const inventoryApi = {
  stats: () => api.get('/inventory/stats').then(r => r.data),
  lowStock: () => api.get('/inventory/low-stock').then(r => r.data),
  products: (params?: any) => api.get('/inventory/products', { params }).then(r => r.data),
  getProduct: (id: string) => api.get(`/inventory/products/${id}`).then(r => r.data),
  createProduct: (data: any) => api.post('/inventory/products', data).then(r => r.data),
  updateProduct: (id: string, data: any) =>
    api.put(`/inventory/products/${id}`, data).then(r => r.data),
  adjustStock: (id: string, data: any) =>
    api.post(`/inventory/products/${id}/adjust`, data).then(r => r.data),
  movements: (productId?: string) =>
    api.get('/inventory/movements', { params: { productId } }).then(r => r.data),
  categories: () => api.get('/inventory/categories').then(r => r.data),
  createCategory: (data: any) => api.post('/inventory/categories', data).then(r => r.data),
};

// ── Invoices ───────────────────────────────────────────
export const invoicesApi = {
  stats: () => api.get('/invoices/stats').then(r => r.data),
  list: (params?: any) => api.get('/invoices', { params }).then(r => r.data),
  get: (id: string) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data: any) => api.post('/invoices', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data).then(r => r.data),
  send: (id: string) => api.post(`/invoices/${id}/send`).then(r => r.data),
  pay: (id: string, data: any) => api.post(`/invoices/${id}/pay`, data).then(r => r.data),
  void: (id: string) => api.post(`/invoices/${id}/void`).then(r => r.data),
  downloadPdf: async (id: string) => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    const popup = window.open(objectUrl, '_blank');
    if (!popup) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },
  pdfUrl: (id: string) => `/api/v1/invoices/${id}/pdf`,
};

// ── Accounting ─────────────────────────────────────────
export const accountingApi = {
  summary: (params?: any) => api.get('/accounting/summary', { params }).then(r => r.data),
  monthly: (year?: number) => api.get('/accounting/monthly', { params: { year } }).then(r => r.data),
  categories: (params?: any) => api.get('/accounting/categories', { params }).then(r => r.data),
  accounts: () => api.get('/accounting/accounts').then(r => r.data),
  transactions: (params?: any) => api.get('/accounting/transactions', { params }).then(r => r.data),
  getTransaction: (id: string) => api.get(`/accounting/transactions/${id}`).then(r => r.data),
  createTransaction: (data: any) => api.post('/accounting/transactions', data).then(r => r.data),
  updateTransaction: (id: string, data: any) =>
    api.put(`/accounting/transactions/${id}`, data).then(r => r.data),
  deleteTransaction: (id: string) =>
    api.delete(`/accounting/transactions/${id}`).then(r => r.data),
};

// ── Reports ────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard').then(r => r.data),
  profitLoss: (from: string, to: string) =>
    api.get('/reports/profit-loss', { params: { from, to } }).then(r => r.data),
  aging: () => api.get('/reports/aging').then(r => r.data),
};

// ── Tenants ────────────────────────────────────────────
export const tenantsApi = {
  me: () => api.get('/tenants/me').then(r => r.data),
  update: (data: any) => api.put('/tenants/me', data).then(r => r.data),
};

// ── Users ──────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users').then(r => r.data),
  create: (data: any) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
};

// ── Audit ──────────────────────────────────────────────
export const auditApi = {
  list: (params?: any) => api.get('/audit', { params }).then(r => r.data),
};
