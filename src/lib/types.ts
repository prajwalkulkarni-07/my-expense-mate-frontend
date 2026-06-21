export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category?: string;
  categoryId?: string;
  paymentMethod?: string;
  paymentMethodId?: string;
  date: string;
  note?: string;
  merchant?: string;
  createdAt: string;
}

export interface Budget {
  id?: string;
  categoryId: string;
  categoryName?: string;
  monthlyLimit: number;
  createdAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
}

export const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔',
  Travel: '✈️',
  Shopping: '🛍️',
  Bills: '📄',
  Health: '💊',
  Entertainment: '🎬',
  Others: '📦',
};

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Travel: '#3b82f6',
  Shopping: '#a855f7',
  Bills: '#eab308',
  Health: '#22c55e',
  Entertainment: '#ec4899',
  Others: '#6b7280',
};

export const PAYMENT_COLORS: Record<string, string> = {
  UPI: '#7c3aed',
  'Credit Card': '#ef4444',
  'Debit Card': '#0ea5e9',
  Cash: '#22c55e',
  'Net Banking': '#f59e0b',
  Wallet: '#ec4899',
  Others: '#6b7280',
};
