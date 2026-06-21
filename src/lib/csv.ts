import { Expense } from './types';

export function exportToCSV(expenses: Expense[], filename = 'expenses.csv') {
  const headers = ['Date', 'Amount', 'Category', 'Payment Method', 'Merchant', 'Note'];
  const rows = expenses.map(e => [
    e.date,
    e.amount.toString(),
    e.category,
    e.paymentMethod,
    e.merchant || '',
    e.note || '',
  ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
