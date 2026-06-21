import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Expense, Budget, CATEGORY_COLORS, PAYMENT_COLORS, CATEGORY_ICONS } from '@/lib/types';
import { parseStoredDate } from '@/lib/date';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { format, startOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameYear } from 'date-fns';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
}

export default function Dashboard({ expenses, budgets }: DashboardProps) {
  const now = new Date();

  const todayTotal = useMemo(
    () => expenses.filter(e => {
      const expenseDate = parseStoredDate(e.date);
      return expenseDate ? isToday(expenseDate) : false;
    }).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const monthTotal = useMemo(
    () => expenses.filter(e => {
      const expenseDate = parseStoredDate(e.date);
      return expenseDate ? isSameMonth(expenseDate, now) : false;
    }).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const yearTotal = useMemo(
    () => expenses.filter(e => {
      const expenseDate = parseStoredDate(e.date);
      return expenseDate ? isSameYear(expenseDate, now) : false;
    }).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  // Category pie data
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => {
      const expenseDate = parseStoredDate(e.date);
      return expenseDate ? isSameMonth(expenseDate, now) : false;
    }).forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Payment pie data
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => {
      const expenseDate = parseStoredDate(e.date);
      return expenseDate ? isSameMonth(expenseDate, now) : false;
    }).forEach(e => {
      map[e.paymentMethod] = (map[e.paymentMethod] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Daily trend
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfMonth(now), end: now });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = expenses.filter(e => e.date === dayStr).reduce((s, e) => s + e.amount, 0);
      return { day: format(day, 'dd'), amount: total };
    });
  }, [expenses]);

  // Monthly bar
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    expenses.forEach(e => {
      const expenseDate = parseStoredDate(e.date);
      if (!expenseDate) {
        return;
      }

      const key = format(expenseDate, 'MMM yy');
      months[key] = (months[key] || 0) + e.amount;
    });
    return Object.entries(months).slice(-6).map(([month, amount]) => ({ month, amount }));
  }, [expenses]);

  // Budget progress
  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(e => {
          const expenseDate = parseStoredDate(e.date);
          return e.categoryId === b.categoryId && (expenseDate ? isSameMonth(expenseDate, now) : false);
        })
        .reduce((s, e) => s + e.amount, 0);
      const pct = Math.min((spent / b.monthlyLimit) * 100, 100);
      return { ...b, spent, pct, categoryName: b.categoryName };
    });
  }, [expenses, budgets]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: todayTotal },
          { label: 'This Month', value: monthTotal },
          { label: 'This Year', value: yearTotal },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{fmt(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Progress */}
      {budgetProgress.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgetProgress.map(b => (
              <div key={b.id || b.categoryId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{CATEGORY_ICONS[b.categoryName || ''] || '📦'} {b.categoryName}</span>
                  <span className="text-muted-foreground">{fmt(b.spent)} / {fmt(b.monthlyLimit)}</span>
                </div>
                <Progress
                  value={b.pct}
                  className={`h-2 ${b.pct >= 100 ? '[&>div]:bg-destructive' : b.pct >= 80 ? '[&>div]:bg-yellow-500' : ''}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0"><CardTitle className="text-base">By Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {categoryData.map(d => (
                      <Cell key={d.name} fill={CATEGORY_COLORS[d.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm pt-8 text-center">No data this month</p>}
          </CardContent>
        </Card>

        {/* Payment Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0"><CardTitle className="text-base">By Payment</CardTitle></CardHeader>
          <CardContent className="h-64">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {paymentData.map(d => (
                      <Cell key={d.name} fill={PAYMENT_COLORS[d.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm pt-8 text-center">No data this month</p>}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0"><CardTitle className="text-base">Daily Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" fontSize={11} className="fill-muted-foreground" />
                <YAxis fontSize={11} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0"><CardTitle className="text-base">Monthly Comparison</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" fontSize={11} className="fill-muted-foreground" />
                <YAxis fontSize={11} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
