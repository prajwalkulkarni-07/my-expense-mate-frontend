import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense, Category, PaymentMethod, CATEGORY_ICONS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatStoredDate, parseStoredDate, toStoredDate } from '@/lib/date';
import { useIsMobile } from '@/hooks/use-mobile';
import { exportToCSV } from '@/lib/csv';
import { Search, Download, Pencil, Trash2, Calendar as CalendarIcon, Plus, X, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TransactionsProps {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAddExpense: () => void;
}

export default function Transactions({ expenses, categories, paymentMethods, onEdit, onDelete, onAddExpense }: TransactionsProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [payFilter, setPayFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const categoriesById = useMemo(
    () => new Map(categories.map(category => [category.id, category])),
    [categories]
  );

  const getCategoryPath = (categoryId?: string, fallbackName?: string) => {
    if (!categoryId) {
      return fallbackName || 'Uncategorized';
    }

    const path: string[] = [];
    let currentCategory = categoriesById.get(categoryId);

    while (currentCategory) {
      path.unshift(currentCategory.name);
      currentCategory = currentCategory.parentId ? categoriesById.get(currentCategory.parentId) : undefined;
    }

    return path.length > 0 ? path.join('/') : (fallbackName || 'Uncategorized');
  };

  const getRootCategoryName = (categoryId?: string, fallbackName?: string) => {
    const categoryPath = getCategoryPath(categoryId, fallbackName);
    return categoryPath.split('/')[0] || fallbackName || '';
  };

  const matchesCategoryFilter = (expenseCategoryId?: string) => {
    if (catFilter === 'all') {
      return true;
    }

    let currentCategoryId = expenseCategoryId;

    while (currentCategoryId) {
      if (currentCategoryId === catFilter) {
        return true;
      }

      currentCategoryId = categoriesById.get(currentCategoryId)?.parentId || undefined;
    }

    return false;
  };

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (search && !(e.note?.toLowerCase().includes(search.toLowerCase()) || e.merchant?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (!matchesCategoryFilter(e.categoryId)) return false;
      if (payFilter !== 'all' && e.paymentMethodId !== payFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [expenses, search, payFilter, dateFrom, dateTo, matchesCategoryFilter]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  const categoriesWithPaths = useMemo(() => {
    const result: { id: string; path: string; depth: number }[] = [];

    const traverse = (parentId: string | null | undefined, depth: number) => {
      const children = categories.filter(c => (c.parentId ?? null) === (parentId ?? null));
      for (const cat of children) {
        result.push({
          id: cat.id,
          path: getCategoryPath(cat.id),
          depth,
        });
        traverse(cat.id, depth + 1);
      }
    };

    traverse(null, 0);
    return result;
  }, [categories, categoriesById]);

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
  const hasActiveFilters = search || catFilter !== 'all' || payFilter !== 'all' || dateFrom || dateTo;

  const resetFilters = () => {
    setSearch('');
    setCatFilter('all');
    setPayFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleDeleteClick = (e: Expense) => {
    setDeleteTarget(e);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5 px-4 pt-6 pb-8">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{filtered.length}</span>
            {' '}transaction{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-medium text-foreground">{fmt(filteredTotal)}</span>
            {' '}total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span> CSV
          </Button>
          <Button size="sm" onClick={onAddExpense} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
            <div className="relative sm:col-span-2 xl:col-span-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search merchant or note"
                className="h-10 pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="xl:col-span-2">
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesWithPaths.map(({ id, path }) => (
                    <SelectItem key={id} value={id}>
                      {path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="xl:col-span-2">
              <Select value={payFilter} onValueChange={setPayFilter}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-10 w-full justify-start gap-2 px-3 text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="truncate">{dateFrom ? formatStoredDate(dateFrom, 'dd-MM-yyyy') : 'From'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseStoredDate(dateFrom)}
                    onSelect={date => setDateFrom(date ? toStoredDate(date) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-10 w-full justify-start gap-2 px-3 text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="truncate">{dateTo ? formatStoredDate(dateTo, 'dd-MM-yyyy') : 'To'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseStoredDate(dateTo)}
                    onSelect={date => setDateTo(date ? toStoredDate(date) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="xl:col-span-1">
              <Button
                variant="ghost"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="h-10 w-full gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Cards, Desktop: Table */}
      {isMobile ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No transactions match the current filters.
              </CardContent>
            </Card>
          ) : filtered.map(e => (
            <Card key={e.id} className="shadow-sm">
              <CardContent className="space-y-3 p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-2xl">{CATEGORY_ICONS[getRootCategoryName(e.categoryId, e.category)] || '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {e.merchant || getCategoryPath(e.categoryId, e.category)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getCategoryPath(e.categoryId, e.category)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-foreground">{fmt(e.amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">{e.paymentMethod || 'No payment method'}</span>
                  <span className="rounded-full bg-muted px-2 py-1">{formatStoredDate(e.date, 'dd MMM yyyy')}</span>
                </div>

                {e.note && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{e.note}</p>
                )}

                <div className="flex items-center justify-end gap-2 border-t pt-2">
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3" onClick={() => onEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-destructive" onClick={() => handleDeleteClick(e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No transactions match the current filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{formatStoredDate(e.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <span className="mr-1">{CATEGORY_ICONS[getRootCategoryName(e.categoryId, e.category)] || '📦'}</span>
                    <span className="truncate align-middle">{getCategoryPath(e.categoryId, e.category)}</span>
                  </TableCell>
                  <TableCell className="max-w-[180px] text-sm">{e.merchant || '—'}</TableCell>
                  <TableCell className="text-sm">{e.paymentMethod}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{e.note || '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(e.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteClick(e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete transaction?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  {deleteTarget?.merchant
                    ? <><span className="font-medium text-foreground">{deleteTarget.merchant}</span> — {fmt(deleteTarget?.amount ?? 0)}</>
                    : <span className="font-medium text-foreground">{fmt(deleteTarget?.amount ?? 0)}</span>
                  }
                  {deleteTarget?.date ? ` on ${formatStoredDate(deleteTarget.date, 'dd MMM yyyy')}` : ''}
                </p>
                <p className="text-destructive/80 text-xs font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}