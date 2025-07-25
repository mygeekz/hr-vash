// src/components/sales/SalesReportForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { get, post } from '@/lib/http';
import PersianDatePicker from '@/components/PersianDatePicker';
import { format } from 'date-fns-jalali';
import { formatCurrency } from '@/lib/number-to-persian'; // اگر این util ندارید، بگویید تا جایگزین دهم.

type Props = {
  open: boolean;
  onClose: () => void;
  userRole: string;
};

type Employee = { id: string; fullName: string };
type Branch = { id: string; name: string };

export const SalesReportForm: React.FC<Props> = ({ open, onClose }) => {
  const { toast } = useToast();

  // ---------- فرم ----------
  const [employeeId, setEmployeeId]         = useState('');
  const [branchId, setBranchId]             = useState('');
  const [reportDateISO, setReportDateISO]   = useState<string>(''); // کنترل مانند AddEmployee
  const [amount, setAmount]                 = useState('');          // با جداکننده
  const [customersCount, setCustomersCount] = useState('');
  const [file, setFile]                     = useState<File | null>(null);

  // ---------- لیست‌ها ----------
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches]   = useState<Branch[]>([]);

  const [submitting, setSubmitting]     = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);

  // ---------- Helpers ----------
  const resetForm = () => {
    setEmployeeId('');
    setBranchId('');
    setReportDateISO('');
    setAmount('');
    setCustomersCount('');
    setFile(null);
  };

  const shownJalali = reportDateISO
    ? format(new Date(reportDateISO), 'yyyy/MM/dd')
    : '';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const withSep = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(withSep);
  };

  const amountNumber = useMemo(
    () => Number(amount.replace(/,/g, '')) || 0,
    [amount]
  );
  const amountWords = useMemo(
    () => (amountNumber > 0 ? formatCurrency(amountNumber) : ''),
    [amountNumber]
  );

  // ---------- Effects ----------
  useEffect(() => {
    if (!open) return;
    const fetchLists = async () => {
      try {
        const [emps, brs] = await Promise.all([get('/employees'), get('/branches')]);
        setEmployees(emps.map((e: any) => ({ id: e.id, fullName: e.fullName })));
        setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
      } catch {
        toast({ title: 'خطا', description: 'دریافت اطلاعات پایه شکست خورد', variant: 'destructive' });
      } finally {
        setLoadingLists(false);
      }
    };
    fetchLists();
  }, [open, toast]);

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!employeeId || !branchId || !reportDateISO || !amountNumber) {
      toast({ title: 'خطا', description: 'فیلدهای ضروری را تکمیل کنید', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('branchId', branchId);
      formData.append('reportDate', reportDateISO); // ISO
      formData.append('amount', String(amountNumber));
      formData.append('customersCount', customersCount || '0');
      if (file) formData.append('attachment', file);

      await post('/sales/reports', formData, 'POST', undefined, true);

      toast({ title: 'موفقیت', description: 'گزارش فروش ثبت شد' });
      resetForm();
      onClose();
    } catch (e: any) {
      toast({
        title: 'خطا',
        description: e?.response?.data?.error || 'ثبت گزارش با مشکل روبرو شد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Render ----------
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">ثبت گزارش فروش</DialogTitle>
        </DialogHeader>

        {loadingLists ? (
          <div className="py-10 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
            {/* employee */}
            <div className="space-y-1">
              <Label>نام کارمند</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="انتخاب کارمند" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* branch */}
            <div className="space-y-1">
              <Label>نام شعبه</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* date */}
            <div className="space-y-1">
              <Label>تاریخ گزارش</Label>
              <PersianDatePicker
                value={reportDateISO}
                onChange={setReportDateISO}
                placeholder="انتخاب تاریخ"
                className="w-full"
              />
              {shownJalali && (
                <span className="text-xs text-muted-foreground pr-1">
                  تاریخ انتخاب‌شده: {shownJalali}
                </span>
              )}
            </div>

            {/* amount */}
            <div className="space-y-1 md:col-span-2">
              <Label>مبلغ فروش (تومان)</Label>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={handleAmountChange}
                placeholder="مثال: 1,000,000"
              />
              {amountWords && (
                <p className="text-xs text-muted-foreground mt-1 pr-1 leading-5">
                  معادل حروفی: {amountWords}
                </p>
              )}
            </div>

            {/* customers count */}
            <div className="space-y-1 md:col-span-1">
              <Label>تعداد مشتری</Label>
              <Input
                inputMode="numeric"
                value={customersCount}
                onChange={(e) => setCustomersCount(e.target.value)}
                placeholder="مثال: 15"
              />
            </div>

            {/* file */}
            <div className="space-y-1 md:col-span-2">
              <Label>بارگذاری فایل گزارش (اختیاری)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.png,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>انصراف</Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingLists}>
            {submitting ? 'در حال ثبت...' : 'ثبت گزارش'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
