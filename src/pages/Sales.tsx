import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReportForm } from '@/components/sales/SalesReportForm';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { SalesTargetManager } from '@/components/sales/SalesTargetManager';
import { SalesAnalytics } from '@/components/sales/SalesAnalytics';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Target, BarChart3 } from 'lucide-react';

const Sales = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportForm, setShowReportForm] = useState(false);

  // Mock user role - in real app this would come from auth context
  const userRole = 'admin'; // 'admin', 'manager', 'employee'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">مدیریت فروش</h1>
          <p className="text-muted-foreground">
            مدیریت گزارشات فروش، اهداف و عملکرد کارکنان
          </p>
        </div>
        <Button 
          onClick={() => setShowReportForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          ثبت گزارش فروش
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            داشبورد
          </TabsTrigger>
          <TabsTrigger value="targets" className="gap-2">
            <Target className="h-4 w-4" />
            اهداف فروش
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            گزارشات و تحلیل
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            گزارش‌های فروش
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <SalesDashboard userRole={userRole} />
        </TabsContent>

        <TabsContent value="targets" className="space-y-6">
          <SalesTargetManager userRole={userRole} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SalesAnalytics userRole={userRole} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>گزارش‌های تفصیلی فروش</CardTitle>
              <CardDescription>
                مشاهده گزارش‌های کامل فروش بر اساس شعبه، کارمند و بازه زمانی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                این بخش در حال توسعه است
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showReportForm && (
        <SalesReportForm 
          open={showReportForm} 
          onClose={() => setShowReportForm(false)}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default Sales;