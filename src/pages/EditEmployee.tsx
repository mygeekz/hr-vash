// src/pages/EditEmployee.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { get, post, del } from '@/lib/http';
// <<< اصلاح ۱: آیکون X به اینجا اضافه شد >>>
import { User, ArrowRight, Save, AtSign, Briefcase, Phone, ScanLine, Building, CalendarDays, UserCheck, ShieldQuestion, Cake, FileText, Upload, Download, Printer, Trash2, X } from 'lucide-react';
import PersianDatePicker from '@/components/PersianDatePicker';
import { formatCurrency } from '@/lib/number-to-persian';
import { format } from 'date-fns-jalali';
import { Separator } from '@/components/ui/separator';

// <<< اصلاح ۲: نام فیلد تاریخ استخدام تصحیح شد >>>
const employeeSchema = z.object({
  fullName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  nationalId: z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
  email: z.string().email('ایمیل معتبر وارد کنید').optional().or(z.literal('')),
  jobTitle: z.string().min(1, 'انتخاب سمت اجباری است'),
  department: z.string().min(1, 'انتخاب بخش اجباری است'),
  branch: z.string().min(1, 'انتخاب شعبه اجباری است'),
  contactNumber: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر وارد کنید'),
  dateOfBirth: z.string().min(1, 'تاریخ تولد اجباری است'),
  dateJoined: z.string().min(1, 'تاریخ استخدام اجباری است'), // از dateOfJoining به dateJoined تغییر کرد
  monthlySalary: z.number().min(1, 'مبلغ حقوق باید بیشتر از صفر باشد'),
  status: z.enum(['active', 'inactive']),
  gender: z.enum(['male', 'female']),
  militaryStatus: z.enum(['completed', 'exempted', 'conscription']).optional(),
  additionalNotes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Document {
  id: string;
  employeeId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  uploadDate: string;
}
interface Employee extends EmployeeFormData {
  id: string;
  photo?: string;
  documents?: Document[];
}

interface Branch { id: string; name: string; }
interface Position { id: string; title: string; }
interface Department { id: string; name: string; }
export default function EditEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]); 
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]); // New files to upload
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]); // Files already on server

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const fetchData = async () => {
      setIsLoading(true);
      try {
        const [employeeData, branchesData, positionsData, departmentsData] = await Promise.all([
          get(`/employees/${id}`),
          get('/branches'),
          get('/positions'),
		  get('/departments'),
        ]);
        
        const sanitizedData = {
            ...employeeData,
            email: employeeData.email || '',
            additionalNotes: employeeData.additionalNotes || '',
            militaryStatus: employeeData.militaryStatus || undefined
        };

        form.reset(sanitizedData);
        setEmployee(sanitizedData);
        setExistingDocuments(employeeData.documents || []);
        setBranches(branchesData);
        setPositions(positionsData);
	    setDepartments(departmentsData);
      } catch (error) {
        toast({ title: "خطا", description: "کارمند یافت نشد یا اطلاعات پایه بارگذاری نشد.", variant: "destructive" });
        navigate('/employees');
      } finally {
        setIsLoading(false);
      }
    };
    
  useEffect(() => {
    fetchData();
  }, [id]);

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      for (const key in data) {
        const value = (data as any)[key];
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      }
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      documentFiles.forEach(file => {
          formData.append('documents', file);
      });

      await post(`/employees/${id}`, formData, 'PUT');
      toast({ title: "موفقیت", description: "اطلاعات کارمند با موفقیت بروزرسانی شد." });
      navigate('/employees');
    } catch (error) {
      toast({ title: "خطا", description: "بروزرسانی اطلاعات با مشکل مواجه شد.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "خطا", description: "حجم عکس نباید بیشتر از ۵ مگابایت باشد", variant: "destructive" });
        return;
      }
      setPhotoFile(file);
    }
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const removeNewDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingDocument = async (docId: string) => {
    if (!confirm('آیا از حذف این مدرک اطمینان دارید؟')) return;
    try {
        await del(`/documents/${docId}`);
        setExistingDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast({title: "موفقیت", description: "مدرک با موفقیت حذف شد."})
    } catch (error) {
        toast({title: "خطا", description: "حذف مدرک با مشکل مواجه شد.", variant: "destructive"})
    }
  };
  
  const watchGender = form.watch('gender');

  if (isLoading) {
    return <div className="text-center p-10">در حال بارگذاری اطلاعات کارمند...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">ویرایش اطلاعات: {form.getValues("fullName")}</h1>
        <Button variant="outline" onClick={() => navigate('/employees')} className="gap-2">
          <ArrowRight className="w-4 h-4" /> بازگشت به لیست
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-card border-primary/20">
             <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><User className="w-6 h-6" />اطلاعات شخصی و شغلی</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>نام و نام خانوادگی *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>شماره تماس *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>ایمیل</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="nationalId" render={({ field }) => (<FormItem><FormLabel>کد ملی *</FormLabel><FormControl><Input maxLength={10} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>تاریخ تولد *</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>جنسیت *</FormLabel><FormControl><ToggleGroup type="single" variant="outline" className="grid w-full grid-cols-2" onValueChange={field.onChange} value={field.value}><ToggleGroupItem value="male">مرد</ToggleGroupItem><ToggleGroupItem value="female">زن</ToggleGroupItem></ToggleGroup></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="militaryStatus" render={({ field }) => (<FormItem><FormLabel>وضعیت نظام وظیفه</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={watchGender === 'female'}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب وضعیت" /></SelectTrigger></FormControl><SelectContent><SelectItem value="completed">پایان خدمت</SelectItem><SelectItem value="exempted">معاف</SelectItem><SelectItem value="conscription">مشمول</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>سمت *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب سمت" /></SelectTrigger></FormControl><SelectContent>{positions.map(p => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
			  <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>بخش *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب بخش" /></SelectTrigger></FormControl><SelectContent>{departments.map(dep => (<SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />              <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>شعبه *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger></FormControl><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              {/* <<< اصلاح ۳: نام فیلد در اینجا هم تصحیح شد >>> */}
              <FormField control={form.control} name="dateJoined" render={({ field }) => (<FormItem><FormLabel>تاریخ استخدام *</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>وضعیت *</FormLabel><FormControl><ToggleGroup type="single" variant="outline" className="grid w-full grid-cols-2" onValueChange={field.onChange} value={field.value}><ToggleGroupItem value="active">فعال</ToggleGroupItem><ToggleGroupItem value="inactive">غیرفعال</ToggleGroupItem></ToggleGroup></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card className="glass-card border-amber-500/20">
            <CardHeader><CardTitle>اطلاعات حقوق</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="monthlySalary" render={({ field }) => (<FormItem><FormLabel>حقوق ماهانه (تومان)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>{field.value > 0 && <p className="text-sm text-muted-foreground pt-2">{formatCurrency(field.value)}</p>}<FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          
          <Card className="glass-card border-gray-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-600"><FileText className="w-5 h-5" />مدارک و فایل‌ها</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">تصویر کارمند</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                    {photoFile ? (<img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />) : employee?.photo ? (<img src={`http://localhost:3001/${employee.photo}`} alt="Employee Photo" className="w-full h-full object-cover" />) : (<User className="w-10 h-10 text-muted-foreground" />)}
                  </div>
                  <div className="flex-1"><input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-upload" /><Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"><Upload className="w-4 h-4" />تغییر تصویر</Label><p className="text-xs text-muted-foreground mt-1">حداکثر ۵ مگابایت - JPG, PNG</p></div>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">مدارک</Label>
                <div className="mt-2 space-y-3">
                  {existingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
                      <div className="flex items-center gap-3 overflow-hidden"><FileText className="w-4 h-4 text-primary" /><p className="text-sm font-medium truncate">{doc.fileName}</p></div>
                      <div className="flex items-center gap-1">
                        <a href={`http://localhost:3001/${doc.filePath}`} target="_blank" rel="noopener noreferrer"><Button type="button" variant="ghost" size="icon" title="دانلود"><Download className="w-4 h-4" /></Button></a>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeExistingDocument(doc.id)} title="حذف"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {documentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-700">فایل جدید: {file.name}</p>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeNewDocument(index)} title="لغو"><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Label htmlFor="documents-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors mt-3"><Upload className="w-4 h-4" />افزودن فایل جدید</Label>
                  <input type="file" multiple onChange={handleDocumentChange} className="hidden" id="documents-upload" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/employees')}>انصراف</Button>
            <Button type="submit" disabled={isLoading}><Save className="ml-2 h-4 w-4" />{isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}