import { KpiCard } from '@/components/ui/dashboard/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  // Mock data - will be replaced with real data later
  const kpiData = [
    {
      title: "کل کارکنان",
      value: 20,
      icon: Users,
      trend: { value: 5, label: "از ماه گذشته" }
    },
    {
      title: "وظایف تکمیل شده",
      value: 45,
      icon: CheckCircle,
      trend: { value: 12, label: "این هفته" }
    },
    {
      title: "وظایف در انتظار",
      value: 12,
      icon: Clock,
      trend: { value: -8, label: "از دیروز" }
    },
    {
      title: "فروش امروز",
      value: "₯۱۲٫۵M",
      icon: TrendingUp,
      trend: { value: 23, label: "از دیروز" }
    }
  ];

  const recentActivities = [
    { id: 1, text: "کارمند جدید اضافه شد", time: "۲ ساعت پیش", type: "user" },
    { id: 2, text: "گزارش فروش شعبه تهران", time: "۴ ساعت پیش", type: "sales" },
    { id: 3, text: "درخواست مرخصی تایید شد", time: "۶ ساعت پیش", type: "leave" },
    { id: 4, text: "وظیفه جدید تعریف شد", time: "۸ ساعت پیش", type: "task" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-primary-foreground shadow-strong">
        <h1 className="text-3xl font-bold mb-2">خوش آمدید به سیستم مدیریت وش‌نیا</h1>
        <p className="text-primary-foreground/80 text-lg">
          مدیریت کارکنان، وظایف و فروش در یک مکان
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div 
            key={index}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              trend={kpi.trend}
            />
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats Chart Placeholder */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              نمودار عملکرد هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">نمودارهای تفصیلی در نسخه بعدی</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>عملیات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/employees/new')}
              className="p-4 bg-gradient-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity h-auto flex-col"
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">افزودن کارمند</p>
            </Button>
            <Button 
              onClick={() => navigate('/tasks?new=1')}
              className="p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors h-auto flex-col"
            >
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">ثبت وظیفه</p>
            </Button>
            <Button 
              onClick={() => navigate('/sales-report/new')}
              className="p-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors h-auto flex-col"
            >
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">گزارش فروش</p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}