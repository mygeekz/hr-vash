import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Calendar,
  Building,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface SalesAnalyticsProps {
  userRole: string;
}

export const SalesAnalytics = ({ userRole }: SalesAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  // Mock data - in real app this would come from API
  const analyticsData = {
    summary: {
      totalSales: 245000000,
      totalCustomers: 1250,
      avgSalePerCustomer: 196000,
      topPerformer: 'احمد محمدی',
      growthRate: 15.2
    },
    branchPerformance: [
      {
        branchName: 'شعبه مرکزی',
        totalSales: 120000000,
        employees: 5,
        customers: 650,
        avgDaily: 4000000,
        growth: 18.5
      },
      {
        branchName: 'شعبه شمال',
        totalSales: 85000000,
        employees: 3,
        customers: 380,
        avgDaily: 2833333,
        growth: 12.3
      },
      {
        branchName: 'شعبه جنوب',
        totalSales: 40000000,
        employees: 2,
        customers: 220,
        avgDaily: 1333333,
        growth: 8.7
      }
    ],
    employeeRanking: [
      {
        rank: 1,
        name: 'احمد محمدی',
        branch: 'شعبه مرکزی',
        sales: 95000000,
        customers: 485,
        avgSale: 195876,
        achievement: 125.5
      },
      {
        rank: 2,
        name: 'فاطمه احمدی',
        branch: 'شعبه شمال',
        sales: 78000000,
        customers: 420,
        avgSale: 185714,
        achievement: 118.2
      },
      {
        rank: 3,
        name: 'علی رضایی',
        branch: 'شعبه مرکزی',
        sales: 72000000,
        customers: 345,
        avgSale: 208695,
        achievement: 98.6
      }
    ],
    monthlyTrend: [
      { month: 'فروردین', sales: 180000000, customers: 950 },
      { month: 'اردیبهشت', sales: 195000000, customers: 1020 },
      { month: 'خرداد', sales: 210000000, customers: 1150 },
      { month: 'تیر', sales: 245000000, customers: 1250 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const handleExportReport = (reportType: string) => {
    toast.success(`گزارش ${reportType} در حال دانلود است...`);
    // Here you would implement the actual export functionality
  };

  const getRankBadge = (rank: number) => {
    const colors = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-gray-100 text-gray-800',
      3: 'bg-orange-100 text-orange-800'
    };
    return colors[rank as keyof typeof colors] || 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
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
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
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
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب شعبه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه شعب</SelectItem>
                  <SelectItem value="branch1">شعبه مرکزی</SelectItem>
                  <SelectItem value="branch2">شعبه شمال</SelectItem>
                  <SelectItem value="branch3">شعبه جنوب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(userRole === 'admin' || userRole === 'manager') && (
              <div>
                <label className="text-sm font-medium mb-2 block">کارمند</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کارمند" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه کارمندان</SelectItem>
                    <SelectItem value="emp1">احمد محمدی</SelectItem>
                    <SelectItem value="emp2">فاطمه احمدی</SelectItem>
                    <SelectItem value="emp3">علی رضایی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button className="w-full">
                اعمال فیلتر
              </Button>
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
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +{analyticsData.summary.growthRate}% رشد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مشتریان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalCustomers.toLocaleString('fa-IR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط فروش</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.avgSalePerCustomer)}</div>
            <p className="text-xs text-muted-foreground">
              به ازای هر مشتری
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">برترین فروشنده</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.topPerformer}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ رشد</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{analyticsData.summary.growthRate}</div>
            <p className="text-xs text-muted-foreground">
              نسبت به دوره قبل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={() => handleExportReport('کامل')}>
          <Download className="h-4 w-4 mr-2" />
          دانلود گزارش کامل
        </Button>
        <Button variant="outline" onClick={() => handleExportReport('شعب')}>
          <Download className="h-4 w-4 mr-2" />
          گزارش شعب
        </Button>
        <Button variant="outline" onClick={() => handleExportReport('کارمندان')}>
          <Download className="h-4 w-4 mr-2" />
          گزارش کارمندان
        </Button>
      </div>

      {/* Branch Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            عملکرد شعب
          </CardTitle>
          <CardDescription>
            مقایسه عملکرد شعب مختلف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام شعبه</TableHead>
                <TableHead>کل فروش</TableHead>
                <TableHead>تعداد کارمند</TableHead>
                <TableHead>تعداد مشتری</TableHead>
                <TableHead>متوسط روزانه</TableHead>
                <TableHead>رشد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData.branchPerformance.map((branch, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{branch.branchName}</TableCell>
                  <TableCell>{formatCurrency(branch.totalSales)}</TableCell>
                  <TableCell>{branch.employees}</TableCell>
                  <TableCell>{branch.customers.toLocaleString('fa-IR')}</TableCell>
                  <TableCell>{formatCurrency(branch.avgDaily)}</TableCell>
                  <TableCell>
                    <Badge className={branch.growth > 15 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {branch.growth}%
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            رتبه‌بندی کارمندان
          </CardTitle>
          <CardDescription>
            عملکرد کارمندان بر اساس فروش و دستیابی به اهداف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رتبه</TableHead>
                <TableHead>نام کارمند</TableHead>
                <TableHead>شعبه</TableHead>
                <TableHead>کل فروش</TableHead>
                <TableHead>تعداد مشتری</TableHead>
                <TableHead>متوسط فروش</TableHead>
                <TableHead>دستیابی به هدف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData.employeeRanking.map((employee) => (
                <TableRow key={employee.rank}>
                  <TableCell>
                    <Badge className={getRankBadge(employee.rank)}>
                      #{employee.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.branch}</TableCell>
                  <TableCell>{formatCurrency(employee.sales)}</TableCell>
                  <TableCell>{employee.customers.toLocaleString('fa-IR')}</TableCell>
                  <TableCell>{formatCurrency(employee.avgSale)}</TableCell>
                  <TableCell>
                    <Badge className={employee.achievement >= 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {employee.achievement}%
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            روند ماهانه فروش
          </CardTitle>
          <CardDescription>
            تغییرات فروش در طول ماه‌های اخیر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ماه</TableHead>
                <TableHead>فروش</TableHead>
                <TableHead>تعداد مشتری</TableHead>
                <TableHead>متوسط فروش به مشتری</TableHead>
                <TableHead>تغییر نسبت به ماه قبل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData.monthlyTrend.map((month, index) => {
                const prevMonth = index > 0 ? analyticsData.monthlyTrend[index - 1] : null;
                const growthRate = prevMonth 
                  ? ((month.sales - prevMonth.sales) / prevMonth.sales * 100).toFixed(1)
                  : '0';
                const avgPerCustomer = Math.round(month.sales / month.customers);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell>{formatCurrency(month.sales)}</TableCell>
                    <TableCell>{month.customers.toLocaleString('fa-IR')}</TableCell>
                    <TableCell>{formatCurrency(avgPerCustomer)}</TableCell>
                    <TableCell>
                      {prevMonth && (
                        <Badge className={parseFloat(growthRate) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {parseFloat(growthRate) > 0 ? '+' : ''}{growthRate}%
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