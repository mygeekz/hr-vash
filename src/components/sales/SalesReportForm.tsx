// src/components/sales/SalesReportForm.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { get, post } from '@/lib/http';
import PersianDatePicker from '@/components/PersianDatePicker';

type Props = {
  open: boolean;
  onClose: () => void;
  userRole: string;
};

type Employee = { id: string; fullName: string };
type Branch = { id: string; name: string };

export const SalesReportForm: React.FC<Props> = ({ open, onClose }) => {
  const [seller, setSeller] = useState('');
  const [branch, setBranch] = useState('');
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [customers, setCustomers] = useState('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [employeesData, branchesData] = await Promise.all([
          get('/employees'),
          get('/branches'),
        ]);
        setEmployees(employeesData);
        setBranches(branchesData);
      } catch (error) {
        toast.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [open]);

  const resetForm = () => {
    setSeller('');
    setBranch('');
    setDate('');
    setAmount('');
    setCustomers('');
  };

  const handleSubmit = async () => {
    if (!seller || !branch || !date || !amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        seller,
        branch,
        date,
        amount: Number(amount.replace(/,/g, '')),
        customers: Number(customers),
      };
      await post('/sales', payload);
      toast.success('Sales report submitted successfully');
      resetForm();
      onClose();
    } catch (error) {
      toast.error('Failed to submit sales report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ثبت گزارش فروش</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seller">فروشنده</Label>
              <Select value={seller} onValueChange={setSeller}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب فروشنده" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.fullName}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">شعبه</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب شعبه" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((br) => (
                    <SelectItem key={br.id} value={br.name}>
                      {br.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">تاریخ</Label>
              <PersianDatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">مبلغ</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 1,000,000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customers">تعداد مشتری</Label>
              <Input
                id="customers"
                type="number"
                value={customers}
                onChange={(e) => setCustomers(e.target.value)}
                placeholder="مثال: 15"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? 'در حال ثبت...' : 'ثبت'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
