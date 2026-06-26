import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AddExpenseDrawer } from "@/components/AddExpenseDrawer";
import { AuthProvider, useAuth } from "@/hooks/use-auth-store";
import { useExpenseStore } from "@/hooks/use-expense-store";
import { Expense } from "@/lib/types";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Insights from "@/pages/Insights";
import SettingsPage from "@/pages/SettingsPage";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { pathname } = useLocation();
  const { token } = useAuth();
  const store = useExpenseStore(token);
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

  if (pathname === "/login") {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard expenses={store.expenses} budgets={store.budgets} categories={store.categories} /></ProtectedRoute>} />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Transactions
              expenses={store.expenses}
              categories={store.categories}
              paymentMethods={store.paymentMethods}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddExpense={handleAddExpense}
            />
          </ProtectedRoute>
        } />
        <Route path="/insights" element={<ProtectedRoute><Insights expenses={store.expenses} /></ProtectedRoute>} />
        <Route path="/settings" element={
          <ProtectedRoute>
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
          </ProtectedRoute>
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
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
