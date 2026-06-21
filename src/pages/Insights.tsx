import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense, CATEGORY_ICONS } from '@/lib/types';
import { isSameMonth } from 'date-fns';
import { TrendingUp, Award, DollarSign, Target } from 'lucide-react';

interface InsightsProps {
  expenses: Expense[];
}

export default function Insights({ expenses }: InsightsProps) {
  const now = new Date();
  const monthExpenses = useMemo(
    () => expenses.filter(e => isSameMonth(new Date(e.date), now)),
    [expenses]
  );

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const daysInMonth = now.getDate();
  const avgDaily = daysInMonth > 0 ? totalMonth / daysInMonth : 0;

  const biggest = monthExpenses.reduce((max, e) => e.amount > max.amount ? e : max, { amount: 0 } as Expense);

  // Highest spending category
  const catMap: Record<string, number> = {};
  monthExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  // Spending by category for list
  const categoryList = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const insights = [
    topCategory
      ? `You spend most on ${topCategory[0]} (${fmt(topCategory[1])}) this month.`
      : 'No expenses recorded this month.',
    avgDaily > 0 ? `Your average daily spending is ${fmt(Math.round(avgDaily))}.` : null,
    biggest?.amount > 0
      ? `Your biggest single expense: ${fmt(biggest.amount)}${biggest.merchant ? ` at ${biggest.merchant}` : ''}.`
      : null,
    monthExpenses.length > 10
      ? `You've made ${monthExpenses.length} transactions this month.`
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Insights</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Daily</p>
              <p className="text-lg font-bold text-foreground">{fmt(Math.round(avgDaily))}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Biggest Expense</p>
              <p className="text-lg font-bold text-foreground">{biggest?.amount ? fmt(biggest.amount) : '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top Category</p>
              <p className="text-lg font-bold text-foreground">{topCategory ? topCategory[0] : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Summaries */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Smart Summaries</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {insights.map((text, i) => (
            <p key={i} className="text-sm text-foreground flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              {text}
            </p>
          ))}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Category Breakdown (This Month)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {categoryList.map(([cat, amount]) => (
            <div key={cat} className="flex justify-between items-center text-sm">
              <span>{CATEGORY_ICONS[cat] || '📦'} {cat}</span>
              <span className="font-semibold text-foreground">{fmt(amount)}</span>
            </div>
          ))}
          {categoryList.length === 0 && <p className="text-sm text-muted-foreground">No expenses this month.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
