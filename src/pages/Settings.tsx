// src/pages/Settings.tsx
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { Moon, Sun, User, Lock, Bell } from 'lucide-react';
import { toast } from 'sonner';

import UserManagement from './Settings/UserManagement';
import { useAuth } from '@/lib/auth';
import { post } from '@/lib/http';

type NotificationsState = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
};

type ProfileData = {
  name: string;
  email: string;
};

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type SmsSettings = {
  username: string;
  password: string;
  pattern: string;
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, token } = useAuth();

  /* ---------------- Profile ---------------- */
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
  });

  /* ---------------- Password ---------------- */
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /* ---------------- Notifications ---------------- */
  const [notifications, setNotifications] = useState<NotificationsState>(() => {
    try {
      const saved = localStorage.getItem('notif-settings');
      return saved
        ? JSON.parse(saved)
        : { emailNotifications: true, pushNotifications: true, weeklyReports: false };
    } catch {
      return { emailNotifications: true, pushNotifications: true, weeklyReports: false };
    }
  });

  /* ---------------- SMS ---------------- */
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({
    username: '',
    password: '',
    pattern: '',
  });

  /* ---------------- Effects ---------------- */
  useEffect(() => {
    if (!user) return;
    setProfileData({
      name: user.fullName ?? '',
      email: user.username ?? '',
    });
  }, [user]);

  useEffect(() => {
    localStorage.setItem('notif-settings', JSON.stringify(notifications));
  }, [notifications]);

  /* ---------------- Handlers ---------------- */
  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      await post(
        `/users/${user.id}`,
        {
          fullName: profileData.name,
          username: profileData.email, // فقط برای نمایش است، readOnly هم هست
          role: user.role,
        },
        'PUT',
        token
      );
      toast.success('اطلاعات پروفایل با موفقیت بروزرسانی شد');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'خطا در بروزرسانی پروفایل');
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (!passwordData.currentPassword) {
      toast.error('رمز فعلی را وارد کنید');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('رمز عبور جدید و تأیید آن مطابقت ندارند');
      return;
    }

    try {
      await post(
        `/users/${user.id}`,
        {
          fullName: profileData.name,
          username: profileData.email,
          role: user.role,
          password: passwordData.newPassword,
        },
        'PUT',
        token
      );
      toast.success('رمز عبور با موفقیت تغییر یافت');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'خطا در تغییر رمز عبور');
    }
  };

  return (
  <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
        <p className="text-muted-foreground">مدیریت تنظیمات حساب کاربری و سیستم</p>
      </div>

      <Tabs defaultValue="profile" className="w-full" dir="rtl">
	  <TabsList
		className="
		  w-full flex flex-row-reverse gap-2
		  [&>[role=tab]]:flex-1  /* هر تب تمام عرض ستون خودش را بگیرد */
		"
	  >
		<TabsTrigger value="sms">پیامک</TabsTrigger>
		<TabsTrigger value="users">مدیریت کاربران</TabsTrigger>
		<TabsTrigger value="appearance">ظاهر</TabsTrigger>
		<TabsTrigger value="notifications">اطلاع‌رسانی</TabsTrigger>
		<TabsTrigger value="security">امنیت</TabsTrigger>
		<TabsTrigger value="profile">پروفایل</TabsTrigger>
	  </TabsList>

        {/* ================= Profile ================= */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="/avatars/admin.jpg" />
                <AvatarFallback className="text-lg">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات پروفایل
                </CardTitle>
                <CardDescription>مدیریت اطلاعات شخصی</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right">نام و نام خانوادگی</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right">ایمیل / نام کاربری</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    readOnly
                    className="bg-muted cursor-not-allowed opacity-70 text-right"
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} className="w-full md:w-auto">
                بروزرسانی اطلاعات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= Security ================= */}
        <TabsContent value="security" dir="rtl">
		  <Card dir="rtl" className="text-right">
			<CardHeader className="text-right">
			  <CardTitle className="flex items-center gap-2">
				<Lock className="w-5 h-5" />
				تغییر رمز عبور
			  </CardTitle>
              <CardDescription>رمز عبور جدید خود را وارد کنید</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-right">رمز عبور فعلی</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-right">رمز عبور جدید</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-right">تأیید رمز عبور جدید</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    className="text-right"
                  />
                </div>
              </div>

              <Button onClick={handlePasswordChange} variant="outline" className="w-full md:w-auto">
                تغییر رمز عبور
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= Appearance ================= */}
        <TabsContent value="appearance" dir="rtl" className="text-right">
		  <Card>
			<CardHeader className="text-right flex flex-row-reverse items-center gap-2">
			  <CardTitle className="flex items-center gap-2">
				{theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
				تنظیمات ظاهری
			  </CardTitle>
			  <CardDescription className="w-full text-right">
				انتخاب تم و ظاهر سیستم
			  </CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
			  {/* تنها سوییچ موجود */}
			  <div className="flex items-center justify-between flex-row-reverse">
				{/* متنِ توضیح */}
				<div className="space-y-0.5 text-right">
				  <Label>حالت تاریک</Label>
				  <p className="text-sm text-muted-foreground">تغییر به حالت تاریک یا روشن</p>
				</div>
				{/* سوییچ */}
				<Switch
				  checked={theme === 'dark'}
				  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
				  className="order-first"
				/>
			  </div>
			</CardContent>
		  </Card>
		</TabsContent>



	{/* ================= Notifications ================= */}
	<TabsContent value="notifications" dir="rtl" className="text-right">
	  <Card dir="rtl" className="text-right">
		<CardHeader className="text-right">
		  <CardTitle className="flex items-center gap-2">
			<Bell className="w-5 h-5" />
			تنظیمات اطلاع‌رسانی
		  </CardTitle>
		  <CardDescription>مدیریت نحوه دریافت اطلاع‌رسانی‌ها</CardDescription>
		</CardHeader>

		<CardContent dir="rtl" className="space-y-4">
		  {/* ---- Email ---- */}
		  <div className="flex items-center gap-4">
			{/* سوئیچ را اول بیاور (سمت چپِ RTL) */}
			<Switch
			  className="shrink-0 order-1"
			  checked={notifications.emailNotifications}
			  onCheckedChange={(checked) =>
				setNotifications((p) => ({ ...p, emailNotifications: checked }))
			  }
			/>
			{/* متن را سمت راست نگه دار */}
			<div className="flex-1 order-2 text-right space-y-0.5">
			  <Label>اطلاع‌رسانی ایمیل</Label>
			  <p className="text-sm text-muted-foreground">
				دریافت اطلاع‌رسانی‌ها از طریق ایمیل
			  </p>
			</div>
		  </div>

		  <Separator />

		  {/* ---- Push ---- */}
		  <div className="flex items-center gap-4">
			<Switch
			  className="shrink-0 order-1"
			  checked={notifications.pushNotifications}
			  onCheckedChange={(checked) =>
				setNotifications((p) => ({ ...p, pushNotifications: checked }))
			  }
			/>
			<div className="flex-1 order-2 text-right space-y-0.5">
			  <Label>اطلاع‌رسانی فوری</Label>
			  <p className="text-sm text-muted-foreground">
				دریافت اطلاع‌رسانی‌های فوری در مرورگر
			  </p>
			</div>
		  </div>

		  <Separator />

		  {/* ---- Weekly reports ---- */}
		  <div className="flex items-center gap-4">
			<Switch
			  className="shrink-0 order-1"
			  checked={notifications.weeklyReports}
			  onCheckedChange={(checked) =>
				setNotifications((p) => ({ ...p, weeklyReports: checked }))
			  }
			/>
			<div className="flex-1 order-2 text-right space-y-0.5">
			  <Label>گزارش‌های هفتگی</Label>
			  <p className="text-sm text-muted-foreground">
				دریافت گزارش خلاصه هفتگی فعالیت‌ها
			  </p>
			</div>
		  </div>
		</CardContent>
	  </Card>
	</TabsContent>


        {/* ================= Users ================= */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* ================= SMS ================= */}
        <TabsContent value="sms">
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                تنظیمات ملی پیامک
              </CardTitle>
              <CardDescription>
                وارد کردن اطلاعات اتصال به ملی پیامک و الگوی پیامک
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smsUser" className="text-right">نام کاربری</Label>
                  <Input
                    id="smsUser"
                    value={smsSettings.username}
                    onChange={(e) =>
                      setSmsSettings((p) => ({ ...p, username: e.target.value }))
                    }
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smsPass" className="text-right">رمز عبور</Label>
                  <Input
                    id="smsPass"
                    type="password"
                    value={smsSettings.password}
                    onChange={(e) =>
                      setSmsSettings((p) => ({ ...p, password: e.target.value }))
                    }
                    className="text-right"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smsPattern" className="text-right">شناسه الگو</Label>
                  <Input
                    id="smsPattern"
                    value={smsSettings.pattern}
                    onChange={(e) =>
                      setSmsSettings((p) => ({ ...p, pattern: e.target.value }))
                    }
                    className="text-right"
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  console.log('send sms test', smsSettings);
                  toast.message('در حال حاضر فقط لاگ می‌شود (API ایجاد نشده)');
                }}
                className="w-full md:w-auto"
              >
                ارسال پیامک آزمایشی
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
