// ✅ نسخه نهایی‌شده و بدون خطای کامپوننت UserManagement.tsx با اصلاح مسیرها

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { get, post, del } from '@/lib/http';

interface User {
  id: string;
  fullName: string;
  username: string;
  role: 'admin' | 'manager' | 'hr' | 'seller';
  isActive: boolean;
  createdAt: string;
}

const userSchema = z.object({
  fullName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد').optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'hr', 'seller']),
});

type UserForm = z.infer<typeof userSchema>;

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      username: '',
      password: '',
      role: 'seller',
    },
  });

  const fetchUsers = async () => {
    try {
      const data = await get('/users');
      setUsers(data);
    } catch {
      toast({ title: 'خطا', description: 'دریافت لیست کاربران با مشکل مواجه شد.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadge = (role: User['role']) => {
    const config = {
      admin: { label: 'مدیر کل', variant: 'destructive' as const },
      manager: { label: 'مدیر', variant: 'default' as const },
      hr: { label: 'منابع انسانی', variant: 'secondary' as const },
      seller: { label: 'فروشنده', variant: 'outline' as const },
    };
    return config[role];
  };

  const getRolePermissions = (role: User['role']) => {
    const access = {
      admin: 'دسترسی کامل به همه بخش‌ها',
      manager: 'مشاهده و تایید درخواست‌ها، گزارشات',
      hr: 'کارکنان، درخواست‌ها، حقوق و دستمزد',
      seller: 'فقط بخش فروش',
    };
    return access[role];
  };

  const onSubmit = async (data: UserForm) => {
    const submission = { ...data };

    if (editingUser && !submission.password) {
      delete submission.password;
    } else if (!editingUser && !submission.password) {
      form.setError('password', { message: 'رمز عبور برای کاربر جدید الزامی است.' });
      return;
    }

    const url = editingUser ? `/users/${editingUser.id}` : '/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      await post(url, submission, method);
      toast({ title: 'موفقیت', description: `کاربر با موفقیت ${editingUser ? 'بروزرسانی' : 'ایجاد'} شد.` });
      fetchUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
    } catch (error) {
      toast({ title: 'خطا', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      fullName: user.fullName,
      username: user.username,
      password: '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    try {
      await post(`/users/${user.id}/status`, { isActive: !user.isActive }, 'PATCH');
      toast({ title: 'موفقیت', description: 'وضعیت کاربر تغییر کرد.' });
      fetchUsers();
    } catch {
      toast({ title: 'خطا', description: 'تغییر وضعیت کاربر با مشکل مواجه شد.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      try {
        await del(`/users/${id}`);
        toast({ title: 'موفقیت', description: 'کاربر حذف شد.' });
        fetchUsers();
      } catch {
        toast({ title: 'خطا', description: 'حذف کاربر با مشکل مواجه شد.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت کاربران</h2>
          <p className="text-muted-foreground">ایجاد، ویرایش و مدیریت کاربران سیستم</p>
        </div>
        <Button onClick={() => { setEditingUser(null); form.reset(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 ml-2" /> کاربر جدید
        </Button>
      </div>

      {/* لیست کاربران */}
      <Card>
        <CardHeader><CardTitle>لیست کاربران ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام کامل</TableHead>
                  <TableHead className="text-right">نام کاربری</TableHead>
                  <TableHead className="text-right">نقش</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تاریخ ایجاد</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell><Badge variant={getRoleBadge(user.role).variant}>{getRoleBadge(user.role).label}</Badge></TableCell>
                    <TableCell><Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'فعال' : 'غیرفعال'}</Badge></TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(user)}>{user.isActive ? <ShieldOff className="w-4 h-4 text-orange-600" /> : <Shield className="w-4 h-4 text-green-600" />}</Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* سطوح دسترسی */}
      <Card>
        <CardHeader><CardTitle>سطوح دسترسی</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['admin', 'manager', 'hr', 'seller'] as const).map(role => (
              <div key={role} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getRoleBadge(role).variant}>{getRoleBadge(role).label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{getRolePermissions(role)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* فرم دیالوگ */}
      <Dialog open={isDialogOpen} onOpenChange={o => { if (!o) { setEditingUser(null); form.reset(); } setIsDialogOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}</DialogTitle>
            <DialogDescription>{editingUser ? 'اطلاعات کاربر را ویرایش کنید' : 'اطلاعات کاربر جدید را وارد کنید'}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>نام و نام خانوادگی *</FormLabel><FormControl><Input placeholder="نام کامل کاربر" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>نام کاربری *</FormLabel><FormControl><Input placeholder="نام کاربری برای ورود" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>{editingUser ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور *'}</FormLabel><FormControl><Input type="password" placeholder={editingUser ? 'برای تغییر وارد کنید' : 'رمز عبور'} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>نقش کاربری *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب نقش" /></SelectTrigger></FormControl><SelectContent><SelectItem value="admin">مدیر کل</SelectItem><SelectItem value="manager">مدیر</SelectItem><SelectItem value="hr">منابع انسانی</SelectItem><SelectItem value="seller">فروشنده</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                <Button type="submit">{editingUser ? 'بروزرسانی' : 'ایجاد کاربر'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
