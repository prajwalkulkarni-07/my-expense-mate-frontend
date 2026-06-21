import { Expense, Budget } from './types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().split('T')[0];
}

const SAMPLE: Array<Omit<Expense, 'id' | 'date' | 'createdAt'>> = [
  { amount: 250, category: 'Food', paymentMethod: 'UPI', merchant: 'Swiggy', note: 'Dinner order' },
  { amount: 1500, category: 'Shopping', paymentMethod: 'Credit Card', merchant: 'Amazon', note: 'Phone case' },
  { amount: 800, category: 'Travel', paymentMethod: 'UPI', merchant: 'Uber', note: 'Airport ride' },
  { amount: 2000, category: 'Bills', paymentMethod: 'Net Banking', merchant: 'Airtel', note: 'Monthly recharge' },
  { amount: 500, category: 'Health', paymentMethod: 'Cash', merchant: 'Apollo Pharmacy' },
  { amount: 350, category: 'Entertainment', paymentMethod: 'Wallet', merchant: 'Netflix', note: 'Subscription' },
  { amount: 120, category: 'Food', paymentMethod: 'Cash', merchant: 'Tea stall' },
  { amount: 3500, category: 'Shopping', paymentMethod: 'Debit Card', merchant: 'Myntra', note: 'Shoes' },
  { amount: 450, category: 'Food', paymentMethod: 'UPI', merchant: 'Zomato', note: 'Lunch' },
  { amount: 1200, category: 'Entertainment', paymentMethod: 'Credit Card', merchant: 'BookMyShow', note: 'Movie tickets' },
  { amount: 600, category: 'Travel', paymentMethod: 'UPI', merchant: 'Ola' },
  { amount: 5000, category: 'Bills', paymentMethod: 'Net Banking', merchant: 'Electricity Board', note: 'Electricity bill' },
  { amount: 180, category: 'Food', paymentMethod: 'UPI', merchant: 'Chai Point' },
  { amount: 950, category: 'Health', paymentMethod: 'UPI', merchant: 'Practo', note: 'Doctor consultation' },
  { amount: 2200, category: 'Shopping', paymentMethod: 'Credit Card', merchant: 'Flipkart', note: 'Headphones' },
  { amount: 75, category: 'Food', paymentMethod: 'Cash', merchant: 'Street food' },
  { amount: 400, category: 'Entertainment', paymentMethod: 'Wallet', merchant: 'Spotify' },
  { amount: 1800, category: 'Travel', paymentMethod: 'Credit Card', merchant: 'IRCTC', note: 'Train ticket' },
  { amount: 300, category: 'Food', paymentMethod: 'UPI', merchant: 'Dominos', note: 'Pizza night' },
  { amount: 700, category: 'Others', paymentMethod: 'Cash', note: 'Gift for friend' },
];

export function seedDemoData(): { expenses: Expense[]; budgets: Budget[] } {
  const expenses: Expense[] = SAMPLE.map(s => {
    const date = randomDate(90);
    return {
      ...s,
      id: uid(),
      date,
      createdAt: new Date(date).toISOString(),
    };
  });

  // Sort newest first
  expenses.sort((a, b) => b.date.localeCompare(a.date));

  const budgets: Budget[] = [
    { category: 'Food', monthlyLimit: 5000 },
    { category: 'Shopping', monthlyLimit: 8000 },
    { category: 'Travel', monthlyLimit: 4000 },
    { category: 'Entertainment', monthlyLimit: 3000 },
    { category: 'Bills', monthlyLimit: 10000 },
  ];

  return { expenses, budgets };
}
