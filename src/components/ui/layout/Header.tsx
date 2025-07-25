// src/components/ui/layout/Header.tsx
import React from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/auth'; // فرض بر این که چنین هوکی دارید

export const Header: React.FC = () => {
  const navigate = useNavigate();

  // اطلاعات کاربر از کانتکست احراز هویت
  const { user, logout } = useAuth(); // { id, fullName, role, ... }
  const userId = user?.id ?? 'system';

  // نوتیفیکیشن‌ها بر اساس یوزر واقعی
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);

  const handleLogout = () => {
    logout();            // اگر در useAuth دارید، لاگ‌اوت واقعی
    navigate('/login');  // هدایت به صفحه ورود
  };

  // تاریخ فارسی
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('fa-IR', { hour12: false });

  return (
    <header className="bg-card border-b border-border px-6 py-4 shadow-soft sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* چون سرچ حذف شده، این قسمت خالی موند تا سمت چپ هدر از بین نرود */}
        <div className="flex-1" />

        {/* بخش اکشن‌ها */}
        <div className="flex items-center gap-4">
          {/* تغییر تم */}
          <ThemeSwitcher />

          {/* نوتیفیکیشن‌ها */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 max-h-96 overflow-y-auto"
            >
              <DropdownMenuLabel className="text-center">
                اطلاع‌رسانی‌ها
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  اعلانی وجود ندارد
                </div>
              )}

              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start p-4 space-y-1 cursor-pointer"
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <h4 className="text-sm font-medium">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(n.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* منوی کاربر */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.avatarUrl ?? ''} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">{user?.fullName ?? 'کاربر'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="ml-2 h-4 w-4" />
                تنظیمات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <LogOut className="ml-2 h-4 w-4" />
                خروج از سیستم
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
