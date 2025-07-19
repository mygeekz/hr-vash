import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FileText, 
  TrendingUp,
  DollarSign,
  Settings,
  Building,
  Building2,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { name: 'کارکنان', href: '/employees', icon: Users },
  { name: 'مدیریت شعب', href: '/branches', icon: Building },
  { name: 'وظایف', href: '/tasks', icon: ClipboardList },
  { name: 'درخواست‌ها', href: '/requests', icon: FileText },
  { name: 'گزارش فروش', href: '/sales', icon: TrendingUp },
  { name: 'حقوق و دستمزد', href: '/salary', icon: DollarSign },
  { name: 'تنظیمات', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  return (
    <div className="w-64 bg-card border-l border-border h-screen flex flex-col shadow-soft"
         style={{ borderLeft: '1px solid hsl(var(--border))', borderRight: 'none' }}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">وش‌نیا</h1>
            <p className="text-xs text-muted-foreground">سیستم مدیریت اداری</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-3 p-3 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-foreground">مدیر سیستم</p>
          <p className="text-xs text-muted-foreground">دسترسی کامل</p>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:border-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          خروج از سیستم
        </Button>
      </div>
    </div>
  );
};