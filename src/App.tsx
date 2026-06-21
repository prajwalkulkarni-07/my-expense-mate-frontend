import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AddExpenseDrawer } from "@/components/AddExpenseDrawer";
import { useExpenseStore } from "@/hooks/use-expense-store";
import { Expense } from "@/lib/types";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Insights from "@/pages/Insights";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const store = useExpenseStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setDrawerOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDrawerOpen(true);
  };

  const handleSave = (expense: Expense) => {
    if (editingExpense) {
      store.updateExpense(expense);
    } else {
      store.addExpense(expense);
    }
  };

  const handleDelete = (id: string) => {
    store.deleteExpense(id);
  };

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard expenses={store.expenses} budgets={store.budgets} />} />
        <Route path="/transactions" element={
          <Transactions 
            expenses={store.expenses} 
            categories={store.categories} 
            paymentMethods={store.paymentMethods}
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onAddExpense={handleAddExpense}
          />
        } />
        <Route path="/insights" element={<Insights expenses={store.expenses} />} />
        <Route path="/settings" element={
          <SettingsPage
            categories={store.categories}
            paymentMethods={store.paymentMethods}
            budgets={store.budgets}
            onAddCategory={store.addCategory}
            onRemoveCategory={store.removeCategory}
            onAddPaymentMethod={store.addPaymentMethod}
            onRemovePaymentMethod={store.removePaymentMethod}
            onSetBudget={store.setBudget}
          />
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <AddExpenseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categories={store.categories}
        paymentMethods={store.paymentMethods}
        onSave={handleSave}
        editExpense={editingExpense}
      />
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
