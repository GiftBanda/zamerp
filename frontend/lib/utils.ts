import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number | string, currency = 'ZMW') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${currency} ${num.toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString('en-ZM', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-ZM', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  void:      'bg-red-50 text-red-400',
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-500',
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money (MTN/Airtel)' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
];

export const TRANSACTION_CATEGORIES = {
  income: [
    'Sales Revenue', 'Service Revenue', 'Rental Income',
    'Interest Income', 'Other Income',
  ],
  expense: [
    'Cost of Goods Sold', 'Salaries & Wages', 'Rent & Utilities',
    'Marketing & Advertising', 'Transport & Fuel', 'Bank Charges',
    'Professional Fees', 'Insurance', 'Office Supplies',
    'Taxes & Levies', 'Other Expenses',
  ],
};
