// src/pages/Sales.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReportForm } from '@/components/sales/SalesReportForm';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { SalesTargetManager } from '@/components/sales/SalesTargetManager';
import { SalesAnalytics } from '@/components/sales/SalesAnalytics';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Target, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportForm, setShowReportForm] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role || 'employee';

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">مدیریت فروش</h1>
          <p className="text-muted-foreground">مدیریت گزارش‌های فروش، اهداف و تحلیل عملکرد</p>
        </div>
        <Button onClick={() => setShowReportForm(true)} className="gap-2">
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
            <FileText className="h-4 w-4" />
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
                مشاهده و فیلتر گزارش‌های ثبت‌شده براساس بازه زمانی، کارمند و شعبه
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* می‌توانید یک جدول ساده لیست گزارش‌ها بگذارید یا از همون SalesAnalytics reuse کنید */}
              <SalesAnalytics userRole={userRole} mode="table" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SalesReportForm
        open={showReportForm}
        onClose={() => setShowReportForm(false)}
        userRole={userRole}
      />
    </div>
  );
}
