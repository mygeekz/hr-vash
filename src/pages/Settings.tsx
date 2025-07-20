import React, { useState, useEffect } from 'react';
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
import UserManagement from './Settings/UserManagement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';

// API-Funktionen
const fetchProfile = async () => {
    const { data } = await http.get('/profile');
    return data;
};

const updateProfile = async (profileData) => {
    const { data } = await http.patch('/profile', profileData);
    return data;
};

const changePassword = async (passwordData) => {
    const { data } = await http.patch('/security/change-password', passwordData);
    return data;
};

const fetchNotificationsSettings = async () => {
    const { data } = await http.get('/settings/notifications');
    return data;
};

const updateNotificationsSettings = async (settings) => {
    const { data } = await http.patch('/settings/notifications', settings);
    return data;
};

const fetchAppearanceSettings = async () => {
    const { data } = await http.get('/settings/appearance');
    return data;
};

const updateAppearanceSettings = async (settings) => {
    const { data } = await http.patch('/settings/appearance', settings);
    return data;
};

const fetchSmsSettings = async () => {
    const { data } = await http.get('/settings/sms');
    return data;
};

const updateSmsSettings = async (settings) => {
    const { data } = await http.patch('/settings/sms', settings);
    return data;
};


export default function Settings() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({ fullName: '', email: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ emailNotifications: true, pushNotifications: true, weeklyReports: false });
  const [smsSettings, setSmsSettings] = useState({ smsUsername: '', smsPassword: '', smsPattern: '' });

  // Queries
  const { data: initialProfile, isLoading: isProfileLoading } = useQuery({
      queryKey: ['profile'],
      queryFn: fetchProfile,
  });

  const { data: notificationsSettings } = useQuery({
    queryKey: ['notificationsSettings'],
    queryFn: fetchNotificationsSettings,
  });

  const { data: appearanceSettings } = useQuery({
    queryKey: ['appearanceSettings'],
    queryFn: fetchAppearanceSettings,
  });

  const { data: smsSettingsData } = useQuery({
    queryKey: ['smsSettings'],
    queryFn: fetchSmsSettings,
  });


  useEffect(() => {
    if (initialProfile) {
      setProfileData({
        fullName: initialProfile.fullName || '',
        email: initialProfile.email || '',
        phone: initialProfile.phone || '',
      });
    }
    if (notificationsSettings) {
        setNotifications(notificationsSettings);
    }
    if (appearanceSettings) {
        setTheme(appearanceSettings.theme);
    }
    if (smsSettingsData) {
        setSmsSettings(smsSettingsData);
    }
  }, [initialProfile, notificationsSettings, appearanceSettings, smsSettingsData, setTheme]);


  // Mutations
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('اطلاعات پروفایل با موفقیت بروزرسانی شد');
    },
    onError: (error) => toast.error(error?.response?.data?.error || 'خطا در بروزرسانی پروفایل'),
  });

  const passwordMutation = useMutation({
      mutationFn: changePassword,
      onSuccess: () => {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          toast.success('رمز عبور با موفقیت تغییر یافت');
      },
      onError: (error) => toast.error(error?.response?.data?.error || 'خطا در تغییر رمز عبور'),
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    profileMutation.mutate(profileData);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('رمز عبور جدید و تأیید رمز عبور مطابقت ندارند');
      return;
    }
    passwordMutation.mutate({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
    });
  };

  const notificationsMutation = useMutation({
      mutationFn: updateNotificationsSettings,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notificationsSettings'] });
          toast.success("تنظیمات اطلاع‌رسانی بروزرسانی شد.");
      },
      onError: (error) => toast.error(error?.response?.data?.error || 'خطا در ذخیره تنظیمات'),
  });

  const appearanceMutation = useMutation({
      mutationFn: updateAppearanceSettings,
      onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['appearanceSettings'] });
          setTheme(data.theme);
          toast.success("تنظیمات ظاهر بروزرسانی شد.");
      },
      onError: (error) => toast.error(error?.response?.data?.error || 'خطا در ذخیره تنظیمات'),
  });

  const smsMutation = useMutation({
      mutationFn: updateSmsSettings,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['smsSettings'] });
          toast.success("تنظیمات پیامک بروزرسانی شد.");
      },
      onError: (error) => toast.error(error?.response?.data?.error || 'خطا در ذخیره تنظیمات'),
  });

  const handleNotificationsChange = (key, value) => {
      const newSettings = { ...notifications, [key]: value };
      setNotifications(newSettings);
      notificationsMutation.mutate(newSettings);
  };

  const handleThemeChange = (checked) => {
      const newTheme = checked ? 'dark' : 'light';
      setTheme(newTheme);
      appearanceMutation.mutate({ theme: newTheme });
  };

  const handleSmsSettingsUpdate = (e) => {
      e.preventDefault();
      smsMutation.mutate(smsSettings);
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
              <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input
                    id="name"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>
              </div>
              <Button type="submit" disabled={profileMutation.isPending} className="w-full md:w-auto">
                {profileMutation.isPending ? 'در حال بروزرسانی...' : 'بروزرسانی اطلاعات'}
              </Button>
              </form>
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
              <form onSubmit={handlePasswordChange} className="space-y-4">
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
              <Button type="submit" disabled={passwordMutation.isPending} variant="outline" className="w-full md:w-auto">
                {passwordMutation.isPending ? 'در حال تغییر...' : 'تغییر رمز عبور'}
              </Button>
              </form>
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
                  onCheckedChange={handleThemeChange}
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
                    onCheckedChange={(checked) => handleNotificationsChange('emailNotifications', checked)}
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
                    onCheckedChange={(checked) => handleNotificationsChange('pushNotifications', checked)}
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
                    onCheckedChange={(checked) => handleNotificationsChange('weeklyReports', checked)}
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
              <form onSubmit={handleSmsSettingsUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smsUser">نام کاربری</Label>
                  <Input
                    id="smsUser"
                    value={smsSettings.smsUsername || ''}
                    onChange={(e) => setSmsSettings(prev => ({ ...prev, smsUsername: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsPass">رمز عبور</Label>
                  <Input
                    id="smsPass"
                    type="password"
                    value={smsSettings.smsPassword || ''}
                    onChange={(e) => setSmsSettings(prev => ({ ...prev, smsPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smsPattern">شناسه الگو</Label>
                  <Input
                    id="smsPattern"
                    value={smsSettings.smsPattern || ''}
                    onChange={(e) => setSmsSettings(prev => ({ ...prev, smsPattern: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={smsMutation.isPending} className="w-full md:w-auto">
                {smsMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات پیامک'}
              </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
