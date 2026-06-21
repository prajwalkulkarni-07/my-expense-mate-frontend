import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Budget, Category, PaymentMethod } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SettingsProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  onAddCategory: (name: string, parentId?: string) => void;
  onRemoveCategory: (id: string) => void;
  onAddPaymentMethod: (name: string) => void;
  onRemovePaymentMethod: (id: string) => void;
  onSetBudget: (budget: Budget) => void;
}

function CategoryTree({ categories, onRemove, level = 0, parentId = null }: { 
  categories: Category[], 
  onRemove: (id: string) => void, 
  level?: number, 
  parentId?: string | null 
}) {
  const children = categories.filter(c => c.parentId === parentId);
  if (!children.length) return null;

  return (
    <div className="space-y-2" style={{ marginLeft: level > 0 ? `${level * 16}px` : 0 }}>
      {children.map(cat => (
        <div key={cat.id} className="flex items-center justify-between bg-secondary/30 px-3 py-2 rounded-lg">
          <span className="text-sm font-medium">{cat.name}</span>
          <button 
            onClick={() => onRemove(cat.id)} 
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {children.map(cat => (
        <CategoryTree
          key={`tree-${cat.id}`}
          categories={categories}
          onRemove={onRemove}
          level={level + 1}
          parentId={cat.id}
        />
      ))}
    </div>
  );
}

export default function SettingsPage({ 
  categories, 
  paymentMethods, 
  budgets, 
  onAddCategory, 
  onRemoveCategory, 
  onAddPaymentMethod, 
  onRemovePaymentMethod, 
  onSetBudget 
}: SettingsProps) {
  const { theme, toggle } = useTheme();
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState<string | null>(null);
  const [newPayName, setNewPayName] = useState('');

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    onAddCategory(name, newCatParent || undefined);
    setNewCatName('');
    setNewCatParent(null);
    toast({ title: `Category "${name}" added!` });
  };

  const handleAddPaymentMethod = () => {
    const name = newPayName.trim();
    if (!name) return;
    onAddPaymentMethod(name);
    setNewPayName('');
    toast({ title: `Payment method "${name}" added!` });
  };

  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      {/* Theme */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Dark Mode</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggle} />
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="New category name"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              className="h-9 flex-1"
            />
            {categories.length > 0 && (
              <Select 
                value={newCatParent || "none"} 
                onValueChange={(val) => setNewCatParent(val === "none" ? null : val)}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root)</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" onClick={handleAddCategory} className="gap-1 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <CategoryTree categories={categories} onRemove={onRemoveCategory} />
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New payment method name"
              value={newPayName}
              onChange={e => setNewPayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPaymentMethod()}
              className="h-9"
            />
            <Button size="sm" onClick={handleAddPaymentMethod} className="gap-1 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map(pm => (
              <span 
                key={pm.id} 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {pm.name}
                <button 
                  onClick={() => { 
                    onRemovePaymentMethod(pm.id); 
                    toast({ title: `Removed "${pm.name}"` }); 
                  }} 
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budgets */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Monthly Budgets</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rootCategories.map(cat => {
            const budget = budgets.find(b => b.categoryId === cat.id);
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <Label className="w-28 text-sm shrink-0">{cat.name}</Label>
                <Input
                  type="number"
                  placeholder="No limit"
                  className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                  inputMode="decimal"
                  defaultValue={budget?.monthlyLimit || ''}
                  onKeyDown={e => {
                    if (e.key === '-') e.preventDefault();
                  }}
                  onBlur={e => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isFinite(val)) return;
                    if (val < 0) {
                      e.currentTarget.value = '';
                      return;
                    }
                    if (val > 0) onSetBudget({ categoryId: cat.id, monthlyLimit: val });
                  }}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
