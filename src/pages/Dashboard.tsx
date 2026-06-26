import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Expense, Budget, Category, CATEGORY_COLORS, PAYMENT_COLORS, CATEGORY_ICONS } from '@/lib/types';
import { parseStoredDate } from '@/lib/date';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { format, startOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameYear } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  categories: Category[];
}

export default function Dashboard({ expenses, budgets, categories }: DashboardProps) {
  const now = new Date();
  const isMobile = useIsMobile();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      setIsDark(el.classList.contains('dark'));
    });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const getRootCategoryName = useMemo(() => {
    return (categoryId?: string, fallbackName?: string) => {
      if (!categoryId) {
        return fallbackName || 'Others';
      }
      let current = categoryById.get(categoryId);
      let guard = 0;
      while (current?.parentId && guard < 25) {
        current = categoryById.get(current.parentId);
        guard += 1;
      }
      return current?.name || fallbackName || 'Others';
    };
  }, [categoryById]);

  const hashToHue = useMemo(() => {
    return (key: string) => {
      let hash = 0;
      for (let i = 0; i < key.length; i += 1) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
      }
      return hash % 360;
    };
  }, []);

  const hexToHsl = useMemo(() => {
    return (hex: string) => {
      const normalized = hex.replace('#', '').trim();
      if (normalized.length !== 6) {
        return null;
      }
      const r = parseInt(normalized.slice(0, 2), 16) / 255;
      const g = parseInt(normalized.slice(2, 4), 16) / 255;
      const b = parseInt(normalized.slice(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;

      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
      }

      const l = (max + min) / 2;
      const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

      return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
    };
  }, []);

  const themedHsl = useMemo(() => {
    return (h: number, s: number, seed: number) => {
      const shadeSteps = [-8, -3, 3, 8];
      const shade = shadeSteps[seed % shadeSteps.length];
      const lBase = isDark ? 62 : 46;
      const l = Math.max(28, Math.min(78, lBase + shade));
      const satBase = isDark ? 74 : 68;
      const sat = Math.max(40, Math.min(90, satBase + (s ? Math.round((s - 60) / 6) : 0)));
      return `hsl(${h} ${sat}% ${l}%)`;
    };
  }, [isDark]);

  const getCategoryColor = useMemo(() => {
    return (name: string) => {
      const base = CATEGORY_COLORS[name];
      const seed = hashToHue(name);
      if (base && base.startsWith('#')) {
        const hsl = hexToHsl(base);
        if (hsl) {
          return themedHsl(hsl.h, hsl.s, seed);
        }
      }
      return themedHsl(seed, 0, seed);
    };
  }, [hashToHue, hexToHsl, themedHsl]);

  const getPaymentColor = useMemo(() => {
    return (name: string) => {
      const base = PAYMENT_COLORS[name];
      const seed = hashToHue(name);
      if (base && base.startsWith('#')) {
        const hsl = hexToHsl(base);
        if (hsl) {
          return themedHsl(hsl.h, hsl.s, seed);
        }
      }
      return themedHsl(seed, 0, seed);
    };
  }, [hashToHue, hexToHsl, themedHsl]);

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
      const rootName = getRootCategoryName(e.categoryId, e.category);
      map[rootName] = (map[rootName] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, getRootCategoryName]);

  // Payment pie data
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => {
      const expenseDate = parseStoredDate(e.date);
      return expenseDate ? isSameMonth(expenseDate, now) : false;
    }).forEach(e => {
      const paymentName = e.paymentMethod || 'Others';
      map[paymentName] = (map[paymentName] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  const renderLegend = (props: any) => {
    const payload = (props?.payload || []) as Array<{ value: string; color: string }>;
    if (!payload.length) {
      return null;
    }
    return (
      <div className={isMobile ? 'mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs' : 'mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs'}>
        {payload.map((item) => (
          <div key={item.value} className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="truncate text-muted-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

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
          <CardContent className="h-72">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={44}
                    outerRadius={isMobile ? 78 : 86}
                    paddingAngle={2}
                    minAngle={3}
                    dataKey="value"
                    labelLine={false}
                  >
                    {categoryData.map(d => (
                      <Cell key={d.name} fill={getCategoryColor(d.name)} stroke="hsl(var(--background))" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend verticalAlign="bottom" align="center" content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm pt-8 text-center">No data this month</p>}
          </CardContent>
        </Card>

        {/* Payment Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0"><CardTitle className="text-base">By Payment</CardTitle></CardHeader>
          <CardContent className="h-72">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius={44}
                    outerRadius={isMobile ? 78 : 86}
                    paddingAngle={2}
                    minAngle={3}
                    dataKey="value"
                    labelLine={false}
                  >
                    {paymentData.map(d => (
                      <Cell key={d.name} fill={getPaymentColor(d.name)} stroke="hsl(var(--background))" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend verticalAlign="bottom" align="center" content={renderLegend} />
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
