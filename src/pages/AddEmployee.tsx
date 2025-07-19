import { postWithFiles, get } from "@/lib/http";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield } from 'lucide-react'; // آیکون Shield اضافه شد

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import {
  User,
  ArrowRight,
  Save,
  X,
  Plus,
  Download,
  Printer,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  DollarSign,
  Upload,
  Briefcase,
  AtSign,
  Phone,
  ScanLine,
  Building,
  CalendarDays,
  UserCheck,
  ShieldQuestion,
  Cake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/number-to-persian';
import PersianDatePicker from '@/components/PersianDatePicker';

// --- تعریف اینترفیس‌ها برای داده‌های دریافتی ---
interface Branch {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}
interface Department { 
  id: string;
  name: string; }
// Form validation schema
const addEmployeeSchema = z.object({
  fullName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  nationalId: z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
  employeeId: z.string().min(3, 'کد کارمندی باید حداقل ۳ کاراکتر باشد'),
  jobTitle: z.string().min(1, 'انتخاب سمت اجباری است'),
  department: z.string().min(1, 'انتخاب بخش اجباری است'),
  branch: z.string().min(1, 'انتخاب شعبه اجباری است'),
  contactNumber: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر وارد کنید'),
  dateOfBirth: z.string().min(1, 'تاریخ تولد اجباری است'),
  dateJoined: z.string().min(1, 'تاریخ استخدام اجباری است'),
  monthlySalary: z.number().min(1, 'مبلغ حقوق باید بیشتر از صفر باشد'),
  status: z.enum(['active', 'inactive']),
  gender: z.enum(['male', 'female'], {
    message: 'انتخاب جنسیت اجباری است'
  }),
  militaryStatus: z.enum(['completed', 'exempted', 'conscription']).optional(),
  additionalNotes: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1, 'عنوان وظیفه اجباری است'),
    description: z.string().min(1, 'توضیحات وظیفه اجباری است'),
    status: z.enum(['pending', 'in_progress', 'completed']),
    assignedDate: z.string().min(1, 'تاریخ تخصیص اجباری است'),
    dueDate: z.string().optional(),
  })).optional(),
});

type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

type FileAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: Date;
};


export default function AddEmployee() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);
  
  // *** تغییر ۱: تعریف state برای داده‌های داینامیک ***
  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]); // State جدید

    const form = useForm<AddEmployeeForm>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      employeeId: '',
      jobTitle: '',
      department: '',
      branch: '',
      contactNumber: '',
      dateOfBirth: '',
      monthlySalary: 0,
      status: 'active',
      gender: 'male' as const,
      militaryStatus: 'completed',
      additionalNotes: '',
      tasks: [],
      dateJoined: '',
    },
  });

  // *** تغییر ۲: دریافت اطلاعات از سرور هنگام بارگذاری صفحه ***
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, positionsData, departmentsData] = await Promise.all([
          get('/branches'),
          get('/positions'),
	      get('/departments'), // دریافت لیست بخش‌ها

        ]);
        setBranches(branchesData);
        setPositions(positionsData);
		setDepartments(departmentsData); // ذخیره در state

      } catch (error) {
        toast({
          title: 'خطا در دریافت اطلاعات پایه',
          description: 'لیست شعب و سمت‌ها از سرور دریافت نشد.',
          variant: 'destructive',
        });
      }
    };
    fetchData();
  }, [toast]);


  const watchGender = form.watch('gender');

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });


  const onSubmit = async (data: AddEmployeeForm) => {
    setIsLoading(true);
    const fd = new FormData();

    Object.entries(data).forEach(([k, v]) => {
      if (k === 'tasks' && Array.isArray(v)) { fd.append(k, JSON.stringify(v)); }
      else if (v !== undefined && v !== null) { fd.append(k, String(v)); }
    });
    if (photoFile) { fd.append('photo', photoFile); }
    documentFiles.forEach(file => { fd.append('documents', file); });

    try {
      await postWithFiles('/employees', fd);
      
      toast({ title: "موفقیت", description: "کارمند جدید با موفقیت اضافه شد" });
      navigate("/employees");
    } catch (error) {
      toast({
        title: "خطا",
        description: "ثبت اطلاعات با مشکل مواجه شد",
        variant: "destructive"
      });
      console.error("Failed to create employee:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "خطا",
          description: "حجم فایل باید کمتر از ۵ مگابایت باشد",
          variant: "destructive"
        });
        return;
      }
      setPhotoFile(file);
    }
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments: FileAttachment[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadDate: new Date(),
    }));

    setDocumentFiles(prev => [...prev, ...files]);
    setFileAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
    setFileAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const downloadFile = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printFile = (attachment: FileAttachment) => {
    if (attachment.type.includes('image') || attachment.type.includes('pdf')) {
      const printWindow = window.open(attachment.url, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    }
  };

  const addNewTask = () => {
    appendTask({
      title: '',
      description: '',
      status: 'pending',
      assignedDate: '',
      dueDate: '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">افزودن کارمند جدید</h1>
          <p className="text-muted-foreground">اطلاعات کارمند جدید را برای ثبت در سیستم وارد کنید.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/employees')} className="gap-2">
          <ArrowRight className="w-4 h-4" />بازگشت به لیست
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-card border-primary/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><User className="w-6 h-6" />اطلاعات شخصی</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><User className="w-4 h-4" />نام و نام خانوادگی *</FormLabel>
                  <FormControl><Input placeholder="مثال: علی محمدی" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
			  <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Cake className="w-4 h-4" />تاریخ تولد *</FormLabel>
                    <FormControl>
                      <PersianDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="انتخاب تاریخ تولد"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
             
              <FormField control={form.control} name="dateJoined" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />تاریخ استخدام *</FormLabel>
                  <FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="انتخاب تاریخ" disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
			  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" />شماره تماس *</FormLabel>
                  <FormControl><Input placeholder="مثال: 09123456789" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nationalId" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><ScanLine className="w-4 h-4" />کد ملی *</FormLabel>
                  <FormControl><Input maxLength={10} placeholder="کد ملی ۱۰ رقمی" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>جنسیت *</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      className="grid w-full grid-cols-2"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <ToggleGroupItem value="male" aria-label="انتخاب مرد" className="w-full data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
                        مرد
                      </ToggleGroupItem>
                      <ToggleGroupItem value="female" aria-label="انتخاب زن" className="w-full data-[state=on]:bg-pink-100 data-[state=on]:text-pink-600">
                        زن
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField control={form.control} name="militaryStatus" render={({ field }) => (
                  <FormItem>
                      <FormLabel className="flex items-center gap-2"><ShieldQuestion className="w-4 h-4" />وضعیت نظام وظیفه</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || watchGender === 'female'}>
                          <FormControl><SelectTrigger><SelectValue placeholder="انتخاب وضعیت" /></SelectTrigger></FormControl>
                          <SelectContent className="bg-card">
                              <SelectItem value="completed">پایان خدمت</SelectItem>
                              <SelectItem value="exempted">معاف از خدمت</SelectItem>
                              <SelectItem value="conscription">مشمول</SelectItem>
                          </SelectContent>
                      </Select>
                      {watchGender === 'female' && <p className="text-xs text-muted-foreground mt-1">این فیلد برای خانم‌ها غیرفعال است.</p>}
                      <FormMessage />
                  </FormItem>
              )} />
			   <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><UserCheck className="w-4 h-4" />کد کارمندی *</FormLabel>
                  <FormControl><Input placeholder="مثال: EMP001" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              {/* *** تغییر کلیدی ۳: اتصال فیلد "سمت" به داده‌های داینامیک *** */}
              <FormField control={form.control} name="jobTitle" render={({ field }) => (
                <FormItem><FormLabel>سمت *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl><SelectTrigger><SelectValue placeholder="انتخاب سمت" /></SelectTrigger></FormControl>
                    <SelectContent className="bg-card">
                      {positions.map(pos => (
                        <SelectItem key={pos.id} value={pos.title}>{pos.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بخش *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب بخش" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map(dep => (
                          <SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* *** تغییر کلیدی ۴: اتصال فیلد "شعبه" به داده‌های داینامیک *** */}
              <FormField control={form.control} name="branch" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Building className="w-4 h-4" />شعبه کاری *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl><SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger></FormControl>
                    <SelectContent className="bg-card">
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت *</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          className="grid w-full grid-cols-2"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <ToggleGroupItem value="active" aria-label="انتخاب فعال" className="w-full data-[state=on]:bg-green-100 data-[state=on]:text-green-700">
                            فعال
                          </ToggleGroupItem>
                          <ToggleGroupItem value="inactive" aria-label="انتخاب غیرفعال" className="w-full data-[state=on]:bg-red-100 data-[state=on]:text-red-700">
                            غیرفعال
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
         
          </Card>
          
          <Card className="glass-card border-amber-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-amber-600"><DollarSign className="w-6 h-6" />اطلاعات حقوق و دستمزد</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <FormField control={form.control} name="monthlySalary" render={({ field }) => (
                <FormItem><FormLabel>میزان حقوق ماهانه (تومان) *</FormLabel>
                  <FormControl><Input type="number" placeholder="10,000,000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} disabled={isLoading} min="0" /></FormControl>
                  {field.value > 0 && (
                    <div className="mt-2 p-3 bg-amber-500/10 rounded-lg text-amber-700">
                      <p className="text-sm font-medium">معادل حروفی: {formatCurrency(field.value)}</p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="additionalNotes" render={({ field }) => (
                <FormItem><FormLabel>توضیحات و اطلاعات اضافی</FormLabel>
                  <FormControl><Textarea placeholder="اطلاعات اضافی درباره کارمند، تخصص‌ها، سابقه کار و سایر موارد..." {...field} disabled={isLoading} rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
          <Card className="glass-card border-gray-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-600"><FileText className="w-5 h-5" />مدارک و فایل‌ها</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">تصویر کارمند</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                    {photoFile ? (<img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />) : (<User className="w-8 h-8 text-muted-foreground" />)}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-upload" disabled={isLoading} />
                    <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"><Upload className="w-4 h-4" />انتخاب تصویر</Label>
                    <p className="text-xs text-muted-foreground mt-1">حداکثر ۵ مگابایت - فرمت JPG، PNG</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">مدارک (قرارداد، رزومه، و...)</Label>
                <div className="mt-2">
                  <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDocumentChange} className="hidden" id="documents-upload" disabled={isLoading} />
                  <Label htmlFor="documents-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"><Upload className="w-4 h-4" />انتخاب فایل‌ها</Label>
                  <p className="text-xs text-muted-foreground mt-1">فرمت PDF، Word، تصاویر - چندین فایل قابل انتخاب</p>
                  {fileAttachments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-medium">فایل‌های ضمیمه شده:</h4>
                      {fileAttachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
                          <div className="flex items-center gap-3 overflow-hidden"><div className="p-2 bg-primary/10 rounded-lg"><FileText className="w-4 h-4 text-primary" /></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{attachment.name}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>{(attachment.size / 1024 / 1024).toFixed(2)} MB</span><span>{format(attachment.uploadDate, "PPP", { locale: faIR })}</span></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => downloadFile(attachment)} disabled={isLoading} title="دانلود"><Download className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => printFile(attachment)} disabled={isLoading} title="چاپ"><Printer className="w-4 h-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(index)} disabled={isLoading} title="حذف"><X className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/employees')} disabled={isLoading}>انصراف</Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-primary hover:opacity-90 shadow-medium">
              {isLoading ? (
                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>در حال ذخیره...</div>
              ) : (
                <div className="flex items-center gap-2"><Save className="w-4 h-4" />ذخیره کارمند</div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}