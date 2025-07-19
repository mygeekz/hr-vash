import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface SalesDashboardProps {
  userRole: string;
}

export const SalesDashboard = ({ userRole }: SalesDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  // Mock data - in real app this would come from API
  const salesData = {
    daily: [
      { date: '1404/10/01', morning: 2500000, evening: 1800000, customers: 25, status: 'completed' },
      { date: '1404/10/02', morning: 3200000, evening: 2100000, customers: 32, status: 'completed' },
      { date: '1404/10/03', morning: 2800000, evening: 1950000, customers: 28, status: 'pending' },
      { date: '1404/10/04', morning: 3500000, evening: 2300000, customers: 35, status: 'completed' },
      { date: '1404/10/05', morning: 0, evening: 0, customers: 0, status: 'not-entered' },
    ],
    monthly: {
      target: 150000000,
      achieved: 89500000,
      percentage: 59.7
    },
    employees: [
      { name: 'احمد محمدی', target: 50000000, achieved: 32000000, percentage: 64 },
      { name: 'فاطمه احمدی', target: 45000000, achieved: 29000000, percentage: 64.4 },
      { name: 'علی رضایی', target: 55000000, achieved: 28500000, percentage: 51.8 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />تکمیل شده</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />در انتظار تأیید</Badge>;
      case 'not-entered':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />وارد نشده</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فروش امروز</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(4750000)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% نسبت به دیروز
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فروش ماهانه</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesData.monthly.achieved)}</div>
            <p className="text-xs text-muted-foreground">
              {salesData.monthly.percentage}% از هدف ماهانه
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مشتریان امروز</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% نسبت به دیروز
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">گزارشات معلق</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              نیاز به بررسی دارند
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle>پیشرفت هدف ماهانه</CardTitle>
          <CardDescription>
            هدف: {formatCurrency(salesData.monthly.target)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {formatCurrency(salesData.monthly.achieved)} از {formatCurrency(salesData.monthly.target)}
              </span>
              <span className={`text-sm font-medium ${
                salesData.monthly.percentage >= 100 ? 'text-green-600' : 
                salesData.monthly.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {salesData.monthly.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={salesData.monthly.percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="انتخاب کارمند" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه کارمندان</SelectItem>
              <SelectItem value="emp1">احمد محمدی</SelectItem>
              <SelectItem value="emp2">فاطمه احمدی</SelectItem>
              <SelectItem value="emp3">علی رضایی</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Daily Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>گزارش فروش روزانه</CardTitle>
          <CardDescription>
            جزئیات فروش به تفکیک روز و نوبت کاری
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>تاریخ</TableHead>
                <TableHead>نوبت صبح</TableHead>
                <TableHead>نوبت عصر</TableHead>
                <TableHead>کل فروش</TableHead>
                <TableHead>تعداد مشتری</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.daily.map((day, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{day.date}</TableCell>
                  <TableCell>{formatCurrency(day.morning)}</TableCell>
                  <TableCell>{formatCurrency(day.evening)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(day.morning + day.evening)}
                  </TableCell>
                  <TableCell>{day.customers}</TableCell>
                  <TableCell>{getStatusBadge(day.status)}</TableCell>
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

      {/* Employee Performance (Admin/Manager only) */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <Card>
          <CardHeader>
            <CardTitle>عملکرد کارمندان</CardTitle>
            <CardDescription>
              مقایسه عملکرد کارمندان با اهداف تعیین شده
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.employees.map((employee, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{employee.name}</h4>
                      <span className={`text-sm font-medium ${
                        employee.percentage >= 100 ? 'text-green-600' : 
                        employee.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {employee.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>{formatCurrency(employee.achieved)}</span>
                      <span>هدف: {formatCurrency(employee.target)}</span>
                    </div>
                    <Progress value={employee.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};