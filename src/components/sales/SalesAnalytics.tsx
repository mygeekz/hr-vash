// src/components/sales/SalesAnalytics.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, Users, DollarSign, Calendar, Building, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { get } from '@/lib/http';
import { useAuth } from '@/lib/auth';

interface Props {
  userRole: string;
}

interface Summary {
  totalSales: number;
  totalCustomers: number;
  avgSalePerCustomer: number;
  topPerformer: string;
  growthRate: number;
}
interface BranchRow {
  branchName: string;
  totalSales: number;
  employees: number;
  customers: number;
  avgDaily: number;
  growth: number;
}
interface EmployeeRow {
  rank: number;
  name: string;
  branch: string;
  sales: number;
  customers: number;
  avgSale: number;
  achievement: number;
}
interface MonthRow {
  month: string;
  sales: number;
  customers: number;
}
interface AnalyticsPayload {
  summary: Summary;
  branchPerformance: BranchRow[];
  employeeRanking: EmployeeRow[];
  monthlyTrend: MonthRow[];
}

export const SalesAnalytics = ({ userRole }: Props) => {
  const { token } = useAuth();
  const [period, setPeriod] = useState<'week'|'month'|'quarter'|'year'>('month');
  const [branch, setBranch] = useState('all');
  const [employee, setEmployee] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const payload: AnalyticsPayload = await get(
        `/sales/analytics?period=${period}&branch=${branch}&employeeId=${employee}`,
        token
      );
      setData(payload);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'خطا در دریافت تحلیل فروش');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, branch, employee]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  const handleExport = async (type: string) => {
    toast.success(`گزارش ${type} در حال دانلود است...`);
    // اینجا درخواست واقعی export را بزن (مثلاً: window.open('/sales/export.xlsx?...'))
  };

  const getRankBadge = (rank: number) => {
    const map: Record<number, string> = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-gray-100 text-gray-800',
      3: 'bg-orange-100 text-orange-800',
    };
    return map[rank] || 'bg-blue-100 text-blue-800';
  };

  if (loading && !data) {
    return <p className="text-center py-10 text-muted-foreground">در حال بارگذاری...</p>;
  }
  if (!data) return null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها و تنظیمات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">دوره زمانی</label>
              <Select value={period} onValueChange={(v:any)=>setPeriod(v)}>
                <SelectTrigger><SelectValue placeholder="انتخاب دوره" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">هفتگی</SelectItem>
                  <SelectItem value="month">ماهانه</SelectItem>
                  <SelectItem value="quarter">فصلی</SelectItem>
                  <SelectItem value="year">سالانه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">شعبه</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه شعب</SelectItem>
                  {data.branchPerformance.map((b, i) => (
                    <SelectItem key={i} value={b.branchName}>{b.branchName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(userRole === 'admin' || userRole === 'manager') && (
              <div>
                <label className="text-sm font-medium mb-2 block">کارمند</label>
                <Select value={employee} onValueChange={setEmployee}>
                  <SelectTrigger><SelectValue placeholder="انتخاب کارمند" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه کارمندان</SelectItem>
                    {data.employeeRanking.map(e => (
                      <SelectItem key={e.rank} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={load} className="w-full">اعمال فیلتر</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل فروش</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline ml-1" />
              +{data.summary.growthRate}% رشد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مشتریان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCustomers.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط فروش</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.avgSalePerCustomer)}</div>
            <p className="text-xs text-muted-foreground">به ازای هر مشتری</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">برترین فروشنده</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.topPerformer}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ رشد</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{data.summary.growthRate}</div>
            <p className="text-xs text-muted-foreground">نسبت به دوره قبل</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={() => handleExport('کامل')}>
          <Download className="h-4 w-4 ml-2" />
          دانلود گزارش کامل
        </Button>
        <Button variant="outline" onClick={() => handleExport('شعب')}>
          <Download className="h-4 w-4 ml-2" />
          گزارش شعب
        </Button>
        <Button variant="outline" onClick={() => handleExport('کارمندان')}>
          <Download className="h-4 w-4 ml-2" />
          گزارش کارمندان
        </Button>
      </div>

      {/* Branch Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />عملکرد شعب</CardTitle>
          <CardDescription>مقایسه عملکرد شعب مختلف</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام شعبه</TableHead>
                <TableHead>کل فروش</TableHead>
                <TableHead>کارمند</TableHead>
                <TableHead>مشتری</TableHead>
                <TableHead>میانگین روزانه</TableHead>
                <TableHead>رشد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.branchPerformance.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{b.branchName}</TableCell>
                  <TableCell>{formatCurrency(b.totalSales)}</TableCell>
                  <TableCell>{b.employees}</TableCell>
                  <TableCell>{b.customers.toLocaleString('fa-IR')}</TableCell>
                  <TableCell>{formatCurrency(b.avgDaily)}</TableCell>
                  <TableCell>
                    <Badge className={b.growth > 15 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {b.growth}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />رتبه‌بندی کارمندان</CardTitle>
          <CardDescription>عملکرد بر اساس فروش و هدف</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رتبه</TableHead>
                <TableHead>نام</TableHead>
                <TableHead>شعبه</TableHead>
                <TableHead>کل فروش</TableHead>
                <TableHead>مشتری</TableHead>
                <TableHead>میانگین فروش</TableHead>
                <TableHead>دستیابی به هدف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.employeeRanking.map((e) => (
                <TableRow key={e.rank}>
                  <TableCell>
                    <Badge className={getRankBadge(e.rank)}>#{e.rank}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.branch}</TableCell>
                  <TableCell>{formatCurrency(e.sales)}</TableCell>
                  <TableCell>{e.customers.toLocaleString('fa-IR')}</TableCell>
                  <TableCell>{formatCurrency(e.avgSale)}</TableCell>
                  <TableCell>
                    <Badge className={e.achievement >= 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {e.achievement}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />روند ماهانه فروش</CardTitle>
          <CardDescription>تغییرات فروش در ماه‌های اخیر</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ماه</TableHead>
                <TableHead>فروش</TableHead>
                <TableHead>مشتری</TableHead>
                <TableHead>متوسط فروش/مشتری</TableHead>
                <TableHead>تغییر ماهانه</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthlyTrend.map((m, idx) => {
                const prev = idx > 0 ? data.monthlyTrend[idx - 1] : null;
                const growth = prev ? ((m.sales - prev.sales) / prev.sales * 100).toFixed(1) : '0';
                const avg = Math.round(m.sales / m.customers);
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{m.month}</TableCell>
                    <TableCell>{formatCurrency(m.sales)}</TableCell>
                    <TableCell>{m.customers.toLocaleString('fa-IR')}</TableCell>
                    <TableCell>{formatCurrency(avg)}</TableCell>
                    <TableCell>
                      {prev && (
                        <Badge className={parseFloat(growth) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                        </Badge>
                      )}
                    </TableCell>
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
