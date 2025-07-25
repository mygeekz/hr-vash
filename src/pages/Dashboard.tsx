import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Activity,
  Calendar,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns-jalali';
import { get } from '@/lib/http'; // کلاینت http را وارد می‌کنیم

// تابع برای دریافت داده‌ها از API جدید
const fetchDashboardStats = () => get('/dashboard/stats');

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // استفاده از useQuery برای دریافت و مدیریت داده‌ها
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  // نمایش اسکلت لودینگ تا زمان دریافت داده‌ها
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // نمایش خطا در صورت بروز مشکل
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold">خطا در بارگذاری داشبورد</h2>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  const kpiData = [
    { title: "کل کارکنان", value: data?.totalEmployees ?? 0, icon: Users, color: "bg-sky-100 text-sky-600" },
    { title: "وظایف تکمیل شده", value: data?.completedTasks ?? 0, icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { title: "وظایف در انتظار", value: data?.pendingTasks ?? 0, icon: Clock, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in" dir="rtl">
      {/* بخش خوش‌آمدگویی */}
      <div className="p-6 md:p-8 text-white bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">خوش آمدید، {user?.fullName || 'کاربر'}!</h1>
        <p className="text-indigo-100 text-base md:text-lg">
          سیستم مدیریت هوشمند وش‌نیا در خدمت شماست.
        </p>
      </div>

      {/* کارت‌های آمار کلیدی با استایل جدید */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="hover:shadow-xl transition-shadow duration-300 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* فعالیت‌های اخیر و اقدامات سریع */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentActivities?.length > 0 ? (
              data.recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Activity className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">فعالیت اخیری ثبت نشده است.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عملیات سریع</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-3">
            <Button onClick={() => navigate('/employees/add')} className="justify-between">
              <span>افزودن کارمند</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/tasks')} variant="secondary" className="justify-between">
              <span>مدیریت وظایف</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/requests')} variant="outline" className="justify-between">
              <span>بررسی درخواست‌ها</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// کامپوننت اسکلت برای نمایش در زمان لودینگ
const DashboardSkeleton = () => (
  <div className="p-4 md:p-6 space-y-6" dir="rtl">
    <Skeleton className="h-36 w-full rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton className="h-28 rounded-lg" />
      <Skeleton className="h-28 rounded-lg" />
      <Skeleton className="h-28 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  </div>
);