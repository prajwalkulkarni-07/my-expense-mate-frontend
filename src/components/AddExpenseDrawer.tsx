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
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatStoredDate, parseStoredDate, toStoredDate } from '@/lib/date';

interface AddExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSave: (expense: Expense) => void;
  editExpense?: Expense | null;
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

  // Get root categories (parentId is null)
  const rootCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  // Get subcategories for selected parent
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
      
      // Find parent category if editing
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

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Content className={isMobile ? "h-[90vh] max-h-[90vh] overflow-hidden flex flex-col" : "w-[420px] max-h-[80vh] p-0 overflow-hidden flex flex-col"}>
        <Header>
          <Title>{editExpense ? 'Edit Expense' : 'Add Expense'}</Title>
          <Description>Quick entry — fill amount, category and payment method.</Description>
        </Header>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              placeholder="0"
              className="text-2xl h-14 font-bold text-center"
              value={amount}
              onChange={e => setAmount(sanitizeAmountInput(e.target.value))}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Parent Category */}
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={parentCategoryId || ''} onValueChange={(val) => {
                  setParentCategoryId(val);
                  // If parent has no subcategories, use parent as category
                  const hasSubs = categories.some(c => c.parentId === val);
                  if (!hasSubs) {
                    setCategoryId(val);
                  } else {
                    setCategoryId('');
                  }
                }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {rootCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory (only show if parent has subs) */}
            {parentCategoryId && subCategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Subcategory *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {subCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* If parent has no subcategories, show payment method here */}
            {parentCategoryId && subCategories.length === 0 && (
              <div className="space-y-1.5">
                <Label>Payment *</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(pm => (
                      <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* If no parent category selected yet, show payment method here */}
            {!parentCategoryId && (
              <div className="space-y-1.5">
                <Label>Payment *</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(pm => (
                      <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* If there are subcategories, show payment method in its own row */}
          {parentCategoryId && subCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Payment *</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatStoredDate(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={parseStoredDate(date)}
                  onSelect={(selectedDate) =>
                    setDate(selectedDate ? toStoredDate(selectedDate) : '')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Merchant */}
          <div className="space-y-1.5">
            <Label htmlFor="merchant">Merchant / Store</Label>
            <Input id="merchant" placeholder="e.g., Swiggy" value={merchant} onChange={e => setMerchant(e.target.value)} />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Input id="note" placeholder="Optional note" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <Button onClick={handleSave} className="w-full h-12 text-base font-semibold">
            {editExpense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      </Content>
    </Root>
  );
}
