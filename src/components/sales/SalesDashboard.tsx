// src/components/sales/SalesDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  TrendingUp, Users, DollarSign, Calendar,
  CheckCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { get } from '@/lib/http';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

interface DailyRow {
  id?: string;
  date: string;
  morning: number;
  evening: number;
  customers: number;
  status: 'completed' | 'pending' | 'not-entered';
}
interface MonthlyBlock {
  target: number;
  achieved: number;
  percentage: number;
}
interface EmployeePerf {
  name: string;
  target: number;
  achieved: number;
  percentage: number;
}
interface DashboardPayload {
  daily: DailyRow[];
  monthly: MonthlyBlock;
  employees: EmployeePerf[];
  todaySales?: number;
  todayCustomers?: number;
  pendingReports?: number;
}
interface Props {
  userRole: string;
  onlyTable?: boolean;
}

export const SalesDashboard = ({ userRole, onlyTable = false }: Props) => {
  const { token } = useAuth();
  const [period, setPeriod] = useState<'day'|'week'|'month'|'year'>('month');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const payload: DashboardPayload = await get(
        `/sales/dashboard?period=${period}${employeeFilter !== 'all' ? `&employeeId=${employeeFilter}` : ''}`,
        token
      );
      setData(payload);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'خطا در دریافت اطلاعات فروش');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, employeeFilter]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  const getStatusBadge = (status: DailyRow['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />تکمیل شده</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 ml-1" />در انتظار</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 ml-1" />وارد نشده</Badge>;
    }
  };

  if (loading && !data) {
    return <p className="text-center py-10 text-muted-foreground">در حال بارگذاری...</p>;
  }

  if (!data) return null;

  const { daily, monthly, employees } = data;

  const summaryCards = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">فروش امروز</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.todaySales ?? (daily[0]?.morning + daily[0]?.evening || 0))}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">فروش ماهانه</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthly.achieved)}</div>
          <p className="text-xs text-muted-foreground">{monthly.percentage.toFixed(1)}% از هدف</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">مشتریان امروز</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.todayCustomers ?? daily[0]?.customers ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">گزارشات معلق</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.pendingReports ?? daily.filter(d => d.status !== 'completed').length}</div>
          <p className="text-xs text-muted-foreground">نیاز به بررسی</p>
        </CardContent>
      </Card>
    </div>
  );

  const filters = (
    <div className="flex gap-4">
      <Select value={period} onValueChange={(v:any)=>setPeriod(v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="انتخاب دوره" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">روزانه</SelectItem>
          <SelectItem value="week">هفتگی</SelectItem>
          <SelectItem value="month">ماهانه</SelectItem>
          <SelectItem value="year">سالانه</SelectItem>
        </SelectContent>
      </Select>

      {userRole === 'admin' && (
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="انتخاب کارمند" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه کارمندان</SelectItem>
            {employees.map((e, i) => (
              <SelectItem key={i} value={e.name}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  const monthlyProgress = (
    <Card>
      <CardHeader>
        <CardTitle>پیشرفت هدف ماهانه</CardTitle>
        <CardDescription>هدف: {formatCurrency(monthly.target)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {formatCurrency(monthly.achieved)} از {formatCurrency(monthly.target)}
            </span>
            <span
              className={clsx(
                'text-sm font-medium',
                monthly.percentage >= 100
                  ? 'text-green-600'
                  : monthly.percentage >= 80
                  ? 'text-yellow-600'
                  : 'text-red-600'
              )}
            >
              {monthly.percentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={monthly.percentage} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );

  const dailyTable = (
    <Card>
      <CardHeader>
        <CardTitle>گزارش فروش روزانه</CardTitle>
        <CardDescription>جزئیات فروش به تفکیک روز و شیفت</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تاریخ</TableHead>
              <TableHead>نوبت صبح</TableHead>
              <TableHead>نوبت عصر</TableHead>
              <TableHead>کل فروش</TableHead>
              <TableHead>مشتری</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daily.map((d, idx) => (
              <TableRow key={d.id || idx}>
                <TableCell className="font-medium">{d.date}</TableCell>
                <TableCell>{formatCurrency(d.morning)}</TableCell>
                <TableCell>{formatCurrency(d.evening)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(d.morning + d.evening)}</TableCell>
                <TableCell>{d.customers}</TableCell>
                <TableCell>{getStatusBadge(d.status)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">جزئیات</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const employeesPerf = (userRole === 'admin' || userRole === 'manager') && (
    <Card>
      <CardHeader>
        <CardTitle>عملکرد کارمندان</CardTitle>
        <CardDescription>مقایسه با اهداف ثبت‌شده</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((e, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{e.name}</h4>
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      e.percentage >= 100
                        ? 'text-green-600'
                        : e.percentage >= 80
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    )}
                  >
                    {e.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{formatCurrency(e.achieved)}</span>
                  <span>هدف: {formatCurrency(e.target)}</span>
                </div>
                <Progress value={e.percentage} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {!onlyTable && summaryCards}
      {!onlyTable && monthlyProgress}
      {!onlyTable && filters}
      {dailyTable}
      {employeesPerf}
    </div>
  );
};
