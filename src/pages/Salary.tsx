import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calculator,
  Receipt,
  Bell,
  Settings,
  ChartLine
} from 'lucide-react';
import SalaryManagement from '@/components/salary/SalaryManagement';
import SalaryReports from '@/components/salary/SalaryReports';
import { formatNumber } from '@/lib/number-to-persian';

interface SalaryData {
  employeeId: string;
  baseSalary: number;
  bonuses: number;
  overtime: number;
  deductions: number;
  tax: number;
  insurance: number;
  paymentDate: Date;
  currency: string;
  notes?: string;
  finalSalary: number;
}

export default function Salary() {
  const [processedSalaries, setProcessedSalaries] = useState<SalaryData[]>([]);
  const [activeTab, setActiveTab] = useState('management');

  // Mock statistics
  const stats = {
    totalEmployees: 25,
    totalPayroll: 350000000,
    pendingPayments: 8,
    averageSalary: 14000000,
  };

  const handleSalaryProcessed = (salaryData: SalaryData) => {
    setProcessedSalaries(prev => [...prev, salaryData]);
    
    // Auto-switch to reports tab after processing
    setTimeout(() => {
      setActiveTab('reports');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مدیریت حقوق و دستمزد</h1>
          <p className="text-muted-foreground">
            پردازش، محاسبه و مدیریت حقوق کارکنان
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Bell className="w-4 h-4" />
            اطلاع‌رسانی‌ها
            <Badge variant="destructive" className="ml-1">3</Badge>
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            تنظیمات
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">کل کارکنان</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">کل حقوق ماهانه</p>
                <p className="text-xl font-bold">{formatNumber(stats.totalPayroll)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-warning" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">پرداخت‌های معلق</p>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">میانگین حقوق</p>
                <p className="text-xl font-bold">{formatNumber(stats.averageSalary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
          <TabsTrigger value="management" className="gap-2">
            <Calculator className="w-4 h-4" />
            پردازش حقوق
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Receipt className="w-4 h-4" />
            گزارشات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <ChartLine className="w-4 h-4" />
            تحلیل‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          <SalaryManagement onSalaryProcessed={handleSalaryProcessed} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <SalaryReports />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine className="w-5 h-5" />
                تحلیل‌های حقوق و دستمزد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <ChartLine className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">تحلیل‌های آماری</h3>
                <p className="text-muted-foreground mb-4">
                  نمودارها و تحلیل‌های آماری حقوق و دستمزد در نسخه‌های آینده اضافه خواهد شد
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">نمودار حقوق ماهانه</Badge>
                  <Badge variant="outline">تحلیل بخش‌ها</Badge>
                  <Badge variant="outline">پیش‌بینی بودجه</Badge>
                  <Badge variant="outline">گزارش عملکرد</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>عملیات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="gap-2">
              <Receipt className="w-4 h-4" />
              پردازش گروهی حقوق
            </Button>
            <Button variant="outline" className="gap-2">
              <DollarSign className="w-4 h-4" />
              محاسبه پاداش عملکرد
            </Button>
            <Button variant="outline" className="gap-2">
              <Calculator className="w-4 h-4" />
              محاسبه مالیات و بیمه
            </Button>
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              تنظیم حقوق پایه
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}