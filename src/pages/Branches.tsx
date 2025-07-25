// src/pages/Branches.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building, User, Edit, Trash2, MapPin, Briefcase, Shield } from 'lucide-react';
import { get, post, del } from '@/lib/http';

// --- Types and Schemas ---
const branchSchema = z.object({
  name: z.string().min(2, 'نام شعبه حداقل ۲ کاراکتر باشد'),
  managerId: z.string().optional(),
});
type BranchForm = z.infer<typeof branchSchema>;

const positionSchema = z.object({
    title: z.string().min(2, 'عنوان سمت حداقل ۲ کاراکتر باشد'),
});
type PositionForm = z.infer<typeof positionSchema>;

// <<< Schema جدید برای بخش‌ها >>>
const departmentSchema = z.object({
    name: z.string().min(2, 'نام بخش حداقل ۲ کاراکتر باشد'),
});
type DepartmentForm = z.infer<typeof departmentSchema>;


interface Employee { id: string; fullName: string; }
interface Branch { id: string; name: string; managerName?: string; employeeCount: number; }
interface Position { id: string; title: string; }
// <<< Interface جدید برای بخش‌ها >>>
interface Department { id: string; name: string; }

export default function Branches() {
    const { toast } = useToast();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]); // <<< State جدید
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
    const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
    const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false); // <<< State جدید

    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null); // <<< State جدید

    const fetchData = async () => {
        try {
            const [branchesData, positionsData, employeesData, departmentsData] = await Promise.all([
                get('/branches'),
                get('/positions'),
                get('/employees'),
                get('/departments'), // <<< دریافت بخش‌ها از سرور
            ]);
            setBranches(branchesData);
            setPositions(positionsData);
            setEmployees(employeesData);
            setDepartments(departmentsData); // <<< ذخیره بخش‌ها
        } catch (error) {
            toast({ title: 'خطا در دریافت اطلاعات', description: 'اتصال به سرور برقرار نشد.', variant: 'destructive' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const branchForm = useForm<BranchForm>({ resolver: zodResolver(branchSchema) });
    const positionForm = useForm<PositionForm>({ resolver: zodResolver(positionSchema) });
    const departmentForm = useForm<DepartmentForm>({ resolver: zodResolver(departmentSchema) }); // <<< Form جدید

    // ... توابع handleBranchSubmit, handleDeleteBranch, handlePositionSubmit, handleDeletePosition ...
    const handleBranchSubmit = async (data: BranchForm) => {
        const url = editingBranch ? `/branches/${editingBranch.id}` : '/branches';
        const method = editingBranch ? 'PUT' : 'POST';
        try {
            await post(url, data, method);
            toast({ title: 'موفقیت', description: `شعبه "${data.name}" با موفقیت ذخیره شد.` });
            fetchData();
        } catch (error) { toast({ title: 'خطا', description: 'ذخیره شعبه با مشکل مواجه شد.', variant: 'destructive' });
        } finally { setIsBranchDialogOpen(false); setEditingBranch(null); }
    };
    const handleDeleteBranch = async (branchId: string) => {
        if (!confirm('آیا از حذف این شعبه اطمینان دارید؟')) return;
        try { await del(`/branches/${branchId}`); toast({ title: 'موفقیت', description: 'شعبه حذف شد.' }); fetchData();
        } catch (error) { toast({ title: 'خطا', description: 'حذف شعبه با مشکل مواجه شد.', variant: 'destructive' }); }
    };
    const handlePositionSubmit = async (data: PositionForm) => {
        const url = editingPosition ? `/positions/${editingPosition.id}` : '/positions';
        const method = editingPosition ? 'PUT' : 'POST';
        try { await post(url, data, method); toast({ title: 'موفقیت', description: `سمت "${data.title}" با موفقیت ذخیره شد.` }); fetchData();
        } catch (error) { toast({ title: 'خطا', description: 'ذخیره سمت با مشکل مواجه شد.', variant: 'destructive' });
        } finally { setIsPositionDialogOpen(false); setEditingPosition(null); }
    };
    const handleDeletePosition = async (positionId: string) => {
        if (!confirm('آیا از حذف این سمت اطمینان دارید؟')) return;
        try { await del(`/positions/${positionId}`); toast({ title: 'موفقیت', description: 'سمت حذف شد.' }); fetchData();
        } catch (error) { toast({ title: 'خطا', description: 'حذف سمت با مشکل مواجه شد.', variant: 'destructive' }); }
    };
    
    // <<< توابع جدید برای مدیریت بخش‌ها >>>
    const handleDepartmentSubmit = async (data: DepartmentForm) => {
        const url = editingDepartment ? `/departments/${editingDepartment.id}` : '/departments';
        const method = editingDepartment ? 'PUT' : 'POST';
        try {
            await post(url, { name: data.name }, method);
            toast({ title: 'موفقیت', description: `بخش "${data.name}" با موفقیت ذخیره شد.` });
            fetchData();
        } catch (error) {
            toast({ title: 'خطا', description: 'ذخیره بخش با مشکل مواجه شد.', variant: 'destructive' });
        } finally {
            setIsDepartmentDialogOpen(false);
            setEditingDepartment(null);
        }
    };
    const handleDeleteDepartment = async (departmentId: string) => {
        if (!confirm('آیا از حذف این بخش اطمینان دارید؟')) return;
        try {
            await del(`/departments/${departmentId}`);
            toast({ title: 'موفقیت', description: 'بخش حذف شد.' });
            fetchData();
        } catch (error) {
            toast({ title: 'خطا', description: 'حذف بخش با مشکل مواجه شد.', variant: 'destructive' });
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                <h1 className="text-3xl font-bold">مدیریت ساختار سازمانی</h1>
                <p className="text-blue-100 mt-2">ایجاد و ویرایش شعب، بخش‌ها و سمت‌های شغلی.</p>
            </div>

            {/* <<< اصلاح گرید برای نمایش سه ستون >>> */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Branches Management */}
                <div className="lg:col-span-2">
                    <Card className="h-full border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-lg">
                            <div className="space-y-1"><CardTitle className="text-blue-800 flex items-center gap-3"><Building className="w-6 h-6" /> مدیریت شعب</CardTitle><CardDescription>افزودن، ویرایش و مشاهده شعب شرکت</CardDescription></div>
                            <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}><DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 ml-2" /> افزودن شعبه</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>{editingBranch ? 'ویرایش شعبه' : 'افزودن شعبه جدید'}</DialogTitle></DialogHeader>
                                    <Form {...branchForm}><form onSubmit={branchForm.handleSubmit(handleBranchSubmit)} className="space-y-4">
                                        <FormField control={branchForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>نام شعبه</FormLabel><FormControl><Input placeholder="مثال: شعبه شمال" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={branchForm.control} name="managerId" render={({ field }) => (<FormItem><FormLabel>سرپرست شعبه</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="یک کارمند را انتخاب کنید" /></SelectTrigger></FormControl><SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsBranchDialogOpen(false)}>انصراف</Button><Button type="submit">{editingBranch ? 'ذخیره تغییرات' : 'ایجاد شعبه'}</Button></div>
                                    </form></Form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table><TableHeader><TableRow><TableHead>نام شعبه</TableHead><TableHead>سرپرست</TableHead><TableHead>پرسنل</TableHead><TableHead className="text-left">عملیات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {branches.map(branch => (
                                        <TableRow key={branch.id} className="hover:bg-blue-50/50">
                                            <TableCell className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{branch.name}</TableCell>
                                            <TableCell><Badge variant="secondary" className="gap-1"><User className="w-3 h-3"/>{branch.managerName || '—'}</Badge></TableCell>
                                            <TableCell><Badge className="bg-blue-100 text-blue-800">{branch.employeeCount}</Badge></TableCell>
                                            <TableCell className="text-left"><div className="flex gap-1 justify-end">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingBranch(branch); branchForm.reset({name: branch.name, managerId: employees.find(e => e.fullName === branch.managerName)?.id || ''}); setIsBranchDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBranch(branch.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* <<< کارت جدید: مدیریت بخش‌ها >>> */}
                <div className="lg:col-span-1">
                    <Card className="h-full border-green-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between bg-green-50 rounded-t-lg">
                            <div className="space-y-1"><CardTitle className="text-green-800 flex items-center gap-3"><Shield className="w-6 h-6" /> مدیریت بخش‌ها</CardTitle><CardDescription>افزودن و ویرایش بخش‌های سازمانی</CardDescription></div>
                            <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}><DialogTrigger asChild><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 ml-2" /> افزودن بخش</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>{editingDepartment ? 'ویرایش بخش' : 'افزودن بخش جدید'}</DialogTitle></DialogHeader>
                                    <Form {...departmentForm}>
                                        <form onSubmit={departmentForm.handleSubmit(handleDepartmentSubmit)} className="space-y-4">
                                            <FormField control={departmentForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>نام بخش</FormLabel><FormControl><Input placeholder="مثال: فروش" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsDepartmentDialogOpen(false)}>انصراف</Button><Button type="submit">{editingDepartment ? 'ذخیره' : 'ایجاد'}</Button></div>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                             <Table><TableHeader><TableRow><TableHead>نام بخش</TableHead><TableHead className="text-left">عملیات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {departments.map(dep => (
                                        <TableRow key={dep.id} className="hover:bg-green-50/50">
                                            <TableCell className="font-medium">{dep.name}</TableCell>
                                            <TableCell className="text-left"><div className="flex gap-1 justify-end">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingDepartment(dep); departmentForm.reset({name: dep.name}); setIsDepartmentDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDepartment(dep.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Positions Management */}
                <div className="lg:col-span-1">
                    <Card className="h-full border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                         <CardHeader className="flex flex-row items-center justify-between bg-purple-50 rounded-t-lg">
                            <div className="space-y-1"><CardTitle className="text-purple-800 flex items-center gap-3"><Briefcase className="w-6 h-6" /> مدیریت سمت‌ها</CardTitle><CardDescription>افزودن و ویرایش سمت‌های شغلی</CardDescription></div>
                            <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}><DialogTrigger asChild><Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 ml-2" /> افزودن سمت</Button></DialogTrigger>
                                 <DialogContent>
                                    <DialogHeader><DialogTitle>{editingPosition ? 'ویرایش سمت' : 'افزودن سمت جدید'}</DialogTitle></DialogHeader>
                                    <Form {...positionForm}>
                                        <form onSubmit={positionForm.handleSubmit(handlePositionSubmit)} className="space-y-4">
                                            <FormField control={positionForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>عنوان سمت</FormLabel><FormControl><Input placeholder="مثال: مدیر بازاریابی" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsPositionDialogOpen(false)}>انصراف</Button><Button type="submit">{editingPosition ? 'ذخیره' : 'ایجاد'}</Button></div>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                             <Table><TableHeader><TableRow><TableHead>عنوان سمت</TableHead><TableHead className="text-left">عملیات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {positions.map(pos => (
                                        <TableRow key={pos.id} className="hover:bg-purple-50/50">
                                            <TableCell className="font-medium">{pos.title}</TableCell>
                                            <TableCell className="text-left"><div className="flex gap-1 justify-end">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingPosition(pos); positionForm.reset({title: pos.title}); setIsPositionDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePosition(pos.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}