import { useState, useCallback, useEffect } from 'react';
import { Expense, Category, PaymentMethod, Budget } from '@/lib/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function useExpenseStore() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [budgets, setBudgetsState] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesRes, categoriesRes, paymentMethodsRes, budgetsRes] = await Promise.all([
        fetch(`${API_BASE}/expenses`),
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/payment-methods`),
        fetch(`${API_BASE}/budgets`)
      ]);

      const expensesData = expensesRes.ok ? await expensesRes.json() : [];
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
      const paymentMethodsData = paymentMethodsRes.ok ? await paymentMethodsRes.json() : [];
      const budgetsData = budgetsRes.ok ? await budgetsRes.json() : [];

      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : []);
      setBudgetsState(Array.isArray(budgetsData) ? budgetsData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      // Set defaults
      setExpenses([]);
      setCategories([]);
      setPaymentMethods([]);
      setBudgetsState([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addExpense = useCallback(async (expense: Expense) => {
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      const newExpense = await res.json();
      setExpenses(prev => [newExpense, ...prev]);
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  }, []);

  const updateExpense = useCallback(async (expense: Expense) => {
    try {
      const res = await fetch(`${API_BASE}/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      const updatedExpense = await res.json();
      setExpenses(prev => prev.map(e => e.id === expense.id ? updatedExpense : e));
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  }, []);

  const addCategory = useCallback(async (name: string, parentId?: string) => {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      });
      const newCategory = await res.json();
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      console.error('Failed to add category:', err);
    }
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
    } catch (err) {
      console.error('Failed to remove category:', err);
    }
  }, []);

  const addPaymentMethod = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const newPaymentMethod = await res.json();
      setPaymentMethods(prev => [...prev, newPaymentMethod]);
    } catch (err) {
      console.error('Failed to add payment method:', err);
    }
  }, []);

  const removePaymentMethod = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/payment-methods/${id}`, { method: 'DELETE' });
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    } catch (err) {
      console.error('Failed to remove payment method:', err);
    }
  }, []);

  const setBudget = useCallback(async (budget: Budget) => {
    try {
      const res = await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget)
      });
      const newBudget = await res.json();
      setBudgetsState(prev => {
        const index = prev.findIndex(b => b.categoryId === budget.categoryId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newBudget };
          return updated;
        }
        return [...prev, newBudget];
      });
    } catch (err) {
      console.error('Failed to set budget:', err);
    }
  }, []);

  return {
    expenses,
    categories,
    paymentMethods,
    budgets,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    removeCategory,
    addPaymentMethod,
    removePaymentMethod,
    setBudget,
    refresh: fetchAll
  };
}
