import { useState, useEffect, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Expense, Category, PaymentMethod } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar as CalendarIcon, Tag, CreditCard, Store, StickyNote, IndianRupee } from 'lucide-react';
import { formatStoredDate, parseStoredDate, toStoredDate } from '@/lib/date';

interface AddExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSave: (expense: Expense) => void;
  editExpense?: Expense | null;
}

function FieldRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2.5 h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function AddExpenseDrawer({ open, onOpenChange, categories, paymentMethods, onSave, editExpense }: AddExpenseDrawerProps) {
  const isMobile = useIsMobile();
  const today = toStoredDate(new Date());
  const [amount, setAmount] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');

  const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  const subCategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return categories.filter(c => c.parentId === parentCategoryId);
  }, [categories, parentCategoryId]);

  useEffect(() => {
    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setCategoryId(editExpense.categoryId || '');
      setPaymentMethodId(editExpense.paymentMethodId || '');
      setDate(editExpense.date);
      setNote(editExpense.note || '');
      setMerchant(editExpense.merchant || '');
      const editCat = categories.find(c => c.id === editExpense.categoryId);
      if (editCat?.parentId) {
        setParentCategoryId(editCat.parentId);
      } else if (editCat) {
        setParentCategoryId(editCat.id);
      }
    } else {
      resetForm();
    }
  }, [editExpense, open, categories]);

  const resetForm = () => {
    setAmount('');
    setParentCategoryId(null);
    setCategoryId('');
    setPaymentMethodId('');
    setDate(today);
    setNote('');
    setMerchant('');
  };

  const sanitizeAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const [whole, ...rest] = cleaned.split('.');
    if (rest.length === 0) return cleaned;
    return `${whole}.${rest.join('')}`;
  };

  const handleSave = () => {
    if (!amount || !categoryId || !paymentMethodId) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Amount must be greater than 0', variant: 'destructive' });
      return;
    }
    const category = categories.find(c => c.id === categoryId);
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    const expense: Expense = {
      id: editExpense?.id || crypto.randomUUID(),
      amount: parsedAmount,
      categoryId,
      category: category?.name,
      paymentMethodId,
      paymentMethod: paymentMethod?.name,
      date,
      note: note || undefined,
      merchant: merchant || undefined,
      createdAt: editExpense?.createdAt || new Date().toISOString(),
    };
    onSave(expense);
    toast({ title: editExpense ? 'Expense updated!' : 'Expense added! ✅' });
    resetForm();
    onOpenChange(false);
  };

  const Root = isMobile ? Drawer : Dialog;
  const Content = isMobile ? DrawerContent : DialogContent;
  const Header = isMobile ? DrawerHeader : DialogHeader;
  const Title = isMobile ? DrawerTitle : DialogTitle;
  const Description = isMobile ? DrawerDescription : DialogDescription;

  const hasSubcategories = parentCategoryId && subCategories.length > 0;

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Content className={isMobile
        ? "h-[92vh] max-h-[92vh] overflow-hidden flex flex-col"
        : "w-[440px] max-h-[85vh] p-0 overflow-hidden flex flex-col gap-0"
      }>
        {/* Header */}
        <Header className={isMobile ? "" : "px-6 pt-6 pb-0"}>
          <Title className="text-lg font-semibold">
            {editExpense ? 'Edit Expense' : 'Add Expense'}
          </Title>
          <Description className="text-sm text-muted-foreground">
            {editExpense ? 'Update the details below.' : 'Quick entry — fill amount, category and payment method.'}
          </Description>
        </Header>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-4 space-y-5">

          {/* Amount — hero field */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 focus-within:border-primary/50 transition-colors">
            <p className="text-xs font-medium text-primary/70 mb-1">Amount *</p>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6 text-primary shrink-0" />
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="0"
                className="flex-1 bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 outline-none w-full"
                value={amount}
                onChange={e => setAmount(sanitizeAmountInput(e.target.value))}
                autoFocus
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Category */}
          <FieldRow icon={<Tag className="h-4 w-4" />}>
            <div className={hasSubcategories ? "grid grid-cols-2 gap-2" : ""}>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category *</Label>
                <Select
                  value={parentCategoryId || ''}
                  onValueChange={(val) => {
                    setParentCategoryId(val);
                    const hasSubs = categories.some(c => c.parentId === val);
                    if (!hasSubs) setCategoryId(val);
                    else setCategoryId('');
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {rootCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasSubcategories && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Subcategory *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </FieldRow>

          {/* Payment Method */}
          <FieldRow icon={<CreditCard className="h-4 w-4" />}>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Payment Method *</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldRow>

          {/* Date */}
          <FieldRow icon={<CalendarIcon className="h-4 w-4" />}>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 justify-start text-left font-normal text-sm">
                    {date ? formatStoredDate(date, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={parseStoredDate(date)}
                    onSelect={d => setDate(d ? toStoredDate(d) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </FieldRow>

          <div className="h-px bg-border" />

          {/* Merchant */}
          <FieldRow icon={<Store className="h-4 w-4" />}>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Merchant / Store</Label>
              <Input
                placeholder="e.g., Swiggy, Zepto..."
                className="h-9 text-sm"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
              />
            </div>
          </FieldRow>

          {/* Note */}
          <FieldRow icon={<StickyNote className="h-4 w-4" />}>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note</Label>
              <Input
                placeholder="Optional note"
                className="h-9 text-sm"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </FieldRow>

          {/* Save button */}
          <Button
            onClick={handleSave}
            className="w-full h-11 text-sm font-semibold mt-2"
          >
            {editExpense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      </Content>
    </Root>
  );
}