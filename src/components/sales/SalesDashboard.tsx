// src/components/sales/SalesDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Users, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { get } from '@/lib/http';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

// Data structures based on the new API
interface SummaryCards {
  todaySales: number;
  monthlySales: number;
  todayCustomers: number;
  pendingReports: number;
}

interface MonthlyProgress {
  target: number;
  achieved: number;
  percentage: number;
}

interface RecentDailyReport {
  id: string;
  date: string;
  totalSale: number;
  customers: number;
  status: 'completed' | 'pending';
}

interface EmployeePerformance {
  name: string;
  target: number;
  achieved: number;
  percentage: number;
}

interface DashboardData {
  summaryCards: SummaryCards;
  monthlyProgress: MonthlyProgress;
  recentDailyReports: RecentDailyReport[];
  employeePerformance: EmployeePerformance[];
}

interface Props {
  userRole: string;
}

export const SalesDashboard = ({ userRole }: Props) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const payload: DashboardData = await get('/sales/dashboard-data');
        setData(payload);
      } catch (e: any) {
        toast.error('خطا در دریافت اطلاعات داشبورد فروش');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  const getStatusBadge = (status: 'completed' | 'pending') => {
    if (status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 ml-1" />
          تکمیل شده
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 ml-1" />
        در انتظار
      </Badge>
    );
  };

  if (loading) {
    return <p className="text-center py-10 text-muted-foreground">در حال بارگذاری...</p>;
  }

  if (!data) {
    return <p className="text-center py-10 text-destructive">اطلاعاتی برای نمایش وجود ندارد.</p>;
  }

  const { summaryCards, monthlyProgress, recentDailyReports, employeePerformance } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فروش امروز</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryCards.todaySales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فروش ماهانه</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryCards.monthlySales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مشتریان امروز</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryCards.todayCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">گزارشات معلق</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryCards.pendingReports}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Progress & Employee Performance */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>پیشرفت هدف ماهانه</CardTitle>
              <CardDescription>هدف: {formatCurrency(monthlyProgress.target)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {formatCurrency(monthlyProgress.achieved)}
                  </span>
                  <span className={clsx('text-sm font-bold', {
                    'text-green-600': monthlyProgress.percentage >= 100,
                    'text-yellow-600': monthlyProgress.percentage >= 80 && monthlyProgress.percentage < 100,
                    'text-red-600': monthlyProgress.percentage < 80,
                  })}>
                    {monthlyProgress.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={monthlyProgress.percentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {(userRole === 'admin' || userRole === 'manager') && (
            <Card>
              <CardHeader>
                <CardTitle>عملکرد کارمندان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeePerformance.map((e, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">{e.name}</h4>
                        <span className={clsx('text-xs font-medium', {
                          'text-green-600': e.percentage >= 100,
                          'text-yellow-600': e.percentage >= 80 && e.percentage < 100,
                          'text-red-600': e.percentage < 80,
                        })}>
                          {e.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={e.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Daily Reports Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>گزارش‌های اخیر روزانه</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>جمع فروش</TableHead>
                    <TableHead>تعداد مشتری</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDailyReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.date}</TableCell>
                      <TableCell>{formatCurrency(report.totalSale)}</TableCell>
                      <TableCell>{report.customers}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          جزئیات
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
