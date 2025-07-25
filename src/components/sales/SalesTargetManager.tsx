// src/components/sales/SalesTargetManager.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit2, Plus, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, del } from '@/lib/http';
import { useAuth } from '@/lib/auth';

interface Props {
  userRole: string;
}
interface TargetRow {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  monthlyTarget: number;
  currentSales: number;
  percentage: number;
  lastUpdated: string;
  status: 'active'|'inactive';
}

export const SalesTargetManager = ({ userRole }: Props) => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TargetRow | null>(null);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [period, setPeriod] = useState<'month'|'quarter'|'year'>('month');

  const [form, setForm] = useState({
    employeeId: '',
    monthlyTarget: '',
    period: 'month',
  });

  const load = async () => {
    try {
      const rows: TargetRow[] = await get('/sales/targets', token);
      setTargets(rows);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'خطا در دریافت اهداف فروش');
    }
  };
  useEffect(() => { load(); }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.monthlyTarget) {
      toast.error('تمام فیلدها الزامی است');
      return;
    }
    try {
      if (editing) {
        await post(`/sales/targets/${editing.id}`, {
          monthlyTarget: Number(form.monthlyTarget),
          period: form.period,
        }, 'PUT', token);
        toast.success('هدف بروزرسانی شد');
      } else {
        await post('/sales/targets', {
          employeeId: form.employeeId,
          monthlyTarget: Number(form.monthlyTarget),
          period: form.period,
        }, 'POST', token);
        toast.success('هدف جدید ثبت شد');
      }
      setIsOpen(false);
      setEditing(null);
      setForm({ employeeId: '', monthlyTarget: '', period: 'month' });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'عملیات ناموفق بود');
    }
  };

  const handleEdit = (row: TargetRow) => {
    setEditing(row);
    setForm({
      employeeId: row.employeeId,
      monthlyTarget: row.monthlyTarget.toString(),
      period: 'month',
    });
    setIsOpen(true);
  };

  const getPerfStatus = (p: number) => {
    if (p >= 100) return { color: 'bg-green-100 text-green-800', icon: TrendingUp, text: 'هدف محقق شده' };
    if (p >= 80) return { color: 'bg-yellow-100 text-yellow-800', icon: Target, text: 'در حال پیگیری' };
    return { color: 'bg-red-100 text-red-800', icon: TrendingDown, text: 'نیاز به بررسی' };
  };

  const overall = {
    totalTargets: targets.reduce((s, t) => s + t.monthlyTarget, 0),
    totalAchieved: targets.reduce((s, t) => s + t.currentSales, 0),
    avgPerformance: targets.length ? targets.reduce((s, t) => s + t.percentage, 0) / targets.length : 0,
    achievedCount: targets.filter(t => t.percentage >= 100).length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل هدف ماهانه</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(overall.totalTargets)}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل محقق شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(overall.totalAchieved)}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین عملکرد</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{overall.avgPerformance.toFixed(1)}%</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اهداف محقق شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overall.achievedCount}</div>
            <p className="text-xs text-muted-foreground">از {targets.length} هدف</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={period} onValueChange={(v:any)=>setPeriod(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="دوره" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">ماهانه</SelectItem>
              <SelectItem value="quarter">فصلی</SelectItem>
              <SelectItem value="year">سالانه</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(userRole === 'admin' || userRole === 'manager') && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-2" />تعیین هدف جدید</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'ویرایش هدف فروش' : 'تعیین هدف فروش جدید'}</DialogTitle>
                <DialogDescription>هدف فروش برای کارمند مورد نظر را تعیین کنید</DialogDescription>
              </DialogHeader>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="employeeId">کد کارمند</Label>
                  <Input
                    id="employeeId"
                    value={form.employeeId}
                    onChange={(e)=>setForm(p=>({...p, employeeId: e.target.value}))}
                    placeholder="مثال: EMP001"
                    disabled={!!editing}
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyTarget">هدف ماهانه (تومان)</Label>
                  <Input
                    id="monthlyTarget"
                    type="number"
                    value={form.monthlyTarget}
                    onChange={(e)=>setForm(p=>({...p, monthlyTarget: e.target.value}))}
                    placeholder="مثال: 50000000"
                  />
                </div>

                <div>
                  <Label>دوره</Label>
                  <Select value={form.period} onValueChange={(v)=>setForm(p=>({...p, period: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">ماهانه</SelectItem>
                      <SelectItem value="quarter">فصلی</SelectItem>
                      <SelectItem value="year">سالانه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={()=>setIsOpen(false)}>انصراف</Button>
                  <Button type="submit">{editing ? 'بروزرسانی' : 'ایجاد هدف'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>اهداف فروش کارمندان</CardTitle>
          <CardDescription>مدیریت و نظارت بر اهداف فروش</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کارمند</TableHead>
                <TableHead>کد</TableHead>
                <TableHead>هدف ماهانه</TableHead>
                <TableHead>محقق شده</TableHead>
                <TableHead>پیشرفت</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>آخرین بروزرسانی</TableHead>
                {(userRole === 'admin' || userRole === 'manager') && <TableHead>عملیات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((t) => {
                const st = getPerfStatus(t.percentage);
                const Icon = st.icon;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.employeeName}</TableCell>
                    <TableCell>{t.employeeId}</TableCell>
                    <TableCell>{formatCurrency(t.monthlyTarget)}</TableCell>
                    <TableCell>{formatCurrency(t.currentSales)}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t.percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={t.percentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={st.color}>
                        <Icon className="h-3 w-3 ml-1" />
                        {st.text}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.lastUpdated}</TableCell>
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={()=>handleEdit(t)}>
                          <Edit2 className="h-3 w-3 ml-1" />ویرایش
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
