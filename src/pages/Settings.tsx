import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import UserManagement from './Settings/UserManagement'; // <<< اصلاح ۱: کامپوننت مدیریت کاربران واقعی وارد شد

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = React.useState({
    name: 'مدیر سیستم',
    email: 'admin@vashnia.com',
    phone: '09123456789'
  });

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = React.useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false
  });

  const [smsSettings, setSmsSettings] = useState({
    username: '',
    password: '',
    pattern: ''
  });

  const handleProfileUpdate = () => {
    toast.success('اطلاعات پروفایل با موفقیت بروزرسانی شد');
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('رمز عبور جدید و تأیید رمز عبور مطابقت ندارند');
      return;
    }
    toast.success('رمز عبور با موفقیت تغییر یافت');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
        <p className="text-muted-foreground">مدیریت تنظیمات حساب کاربری و سیستم</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">پروفایل</TabsTrigger>
          <TabsTrigger value="security">امنیت</TabsTrigger>
          <TabsTrigger value="notifications">اطلاع‌رسانی</TabsTrigger>
          <TabsTrigger value="appearance">ظاهر</TabsTrigger>
          <TabsTrigger value="users">مدیریت کاربران</TabsTrigger>
          <TabsTrigger value="sms">پیامک</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="/avatars/admin.jpg" />
                <AvatarFallback className="text-lg">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات پروفایل
                </CardTitle>
                <CardDescription>
                  مدیریت اطلاعات شخصی و تماس
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleProfileUpdate} className="w-full md:w-auto">
                بروزرسانی اطلاعات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                تغییر رمز عبور
              </CardTitle>
              <CardDescription>
                رمز عبور جدید خود را وارد کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">رمز عبور جدید</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأیید رمز عبور جدید</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handlePasswordChange} variant="outline" className="w-full md:w-auto">
                تغییر رمز عبور
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                تنظیمات ظاهری
              </CardTitle>
              <CardDescription>
                انتخاب تم و ظاهر سیستم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>حالت تاریک</Label>
                  <p className="text-sm text-muted-foreground">
                    تغییر به حالت تاریک یا روشن
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                تنظیمات اطلاع‌رسانی
              </CardTitle>
              <CardDescription>
                مدیریت نحوه دریافت اطلاع‌رسانی‌ها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>اطلاع‌رسانی ایمیل</Label>
                    <p className="text-sm text-muted-foreground">
                      دریافت اطلاع‌رسانی‌ها از طریق ایمیل
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>اطلاع‌رسانی فوری</Label>
                    <p className="text-sm text-muted-foreground">
                      دریافت اطلاع‌رسانی‌های فوری در مرورگر
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>گزارش‌های هفتگی</Label>
                    <p className="text-sm text-muted-foreground">
                      دریافت گزارش خلاصه هفتگی فعالیت‌ها
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <<< اصلاح ۲: کامپوننت واقعی مدیریت کاربران در اینجا قرار گرفت >>> */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
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
                  <Label htmlFor="smsUser">نام کاربری</Label>
                  <Input
                    id="smsUser"
                    value={smsSettings.username}
                    onChange={(e) => setSmsSettings(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsPass">رمز عبور</Label>
                  <Input
                    id="smsPass"
                    type="password"
                    value={smsSettings.password}
                    onChange={(e) => setSmsSettings(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smsPattern">شناسه الگو</Label>
                  <Input
                    id="smsPattern"
                    value={smsSettings.pattern}
                    onChange={(e) => setSmsSettings(prev => ({ ...prev, pattern: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  console.log('send sms', smsSettings);
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
