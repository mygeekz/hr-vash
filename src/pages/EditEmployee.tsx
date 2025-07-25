// src/pages/EditEmployee.tsx
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useReactToPrint } from 'react-to-print';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PersianDatePicker from '@/components/PersianDatePicker';
import EmploymentContract, { ContractData } from '@/components/contract/EmploymentContract';

// Hooks and Libs
import { useToast } from '@/hooks/use-toast';
import { get, post, del } from '@/lib/http';
import { formatCurrency } from '@/lib/number-to-persian';
import { formatContractDate } from '@/lib/format-contract-date';
import { exportHtmlToDocx } from '@/lib/exportDocx';


// Icons
import {
  User,
  ArrowRight,
  Save,
  FileText,
  Upload,
  Download,
  Printer,
  Trash2,
  X,
  FileDown, // <--- (۲) آیکون جدید برای دکمه دانلود
} from 'lucide-react';


/* ------------------ Helpers ------------------ */
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFaDigits = (val: any) => String(val ?? '').replace(/\d/g, d => PERSIAN_DIGITS[Number(d)]);

/* ------------------ Schemas ------------------ */
const contractSchema = z.object({
  employerName: z.string().optional(),
  employerNatId: z.string().optional(),
  employerAddress: z.string().optional(),
  employerPhone: z.string().optional(),
  employeeAddress: z.string().optional(),
  employeeEdu: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workFrom: z.string().optional(),
  workTo: z.string().optional(),
  salary: z.string().optional(),
  positionDesc: z.string().optional(),
  benefits: z.string().optional(),
  termination: z.string().optional(),
  other: z.string().optional(),
});

const employeeSchema = z
  .object({
    fullName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
    nationalId: z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
    email: z.string().email('ایمیل معتبر وارد کنید').optional().or(z.literal('')),
    jobTitle: z.string().min(1, 'انتخاب سمت اجباری است'),
    department: z.string().min(1, 'انتخاب بخش اجباری است'),
    branch: z.string().min(1, 'انتخاب شعبه اجباری است'),
    contactNumber: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر وارد کنید'),
    dateOfBirth: z.string().min(1, 'تاریخ تولد اجباری است'),
    dateJoined: z.string().min(1, 'تاریخ استخدام اجباری است'),
    monthlySalary: z.number().min(1, 'مبلغ حقوق باید بیشتر از صفر باشد'),
    status: z.enum(['active', 'inactive']),
    gender: z.enum(['male', 'female']),
    militaryStatus: z.enum(['completed', 'exempted', 'conscription']).optional(),
    additionalNotes: z.string().optional(),
  })
  .extend({
    contract: contractSchema.optional(),
  });

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface DocumentFile {
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
  documents?: DocumentFile[];
}

interface Branch { id: string; name: string; }
interface Position { id: string; title: string; }
interface Department { id: string; name: string; }

/* ------------------ Defaults ------------------ */
const EMPLOYER_DEFAULT = {
  employerName: 'حمیدرضا وش نیا',
  employerNatId: '0065328205',
  employerAddress: 'شهر قدس- سرخه حصار – خیابان امام علی - روبه‌روی پارک سرخه حصار – بازرگانی وش نیا',
  employerPhone: '09121504859',
};

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
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<DocumentFile[]>([]);
  const [contractOpen, setContractOpen] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });
  const watchGender = form.watch('gender');

  /* ---------- Print / Docx Refs and Handlers ---------- */
  const printRef = useRef<HTMLDivElement>(null);
  const originalHtmlRef = useRef<string>('');

  const handlePrint = useReactToPrint({
    content: () => printRef.current || null,
    documentTitle: `قرارداد-${toFaDigits(form.getValues('fullName') || '')}`,
    removeAfterPrint: true,
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print { .no-print { display:none !important; } }
    `,
    onBeforeGetContent: () =>
      new Promise<void>((resolve) => {
        if (printRef.current) {
          originalHtmlRef.current = printRef.current.innerHTML;
          printRef.current.innerHTML = toFaDigits(printRef.current.innerHTML);
        }
        requestAnimationFrame(() => resolve());
      }),
    onAfterPrint: () => {
      if (printRef.current && originalHtmlRef.current) {
        printRef.current.innerHTML = originalHtmlRef.current;
      }
    },
  });

  // (۳) تابع جدید برای خروجی Docx
  const handleExportDocx = async () => {
    if (!printRef.current) {
      toast({ title: 'خطا', description: 'محتوای قرارداد برای ساخت فایل یافت نشد.', variant: 'destructive' });
      return;
    }
    try {
      // محتوای HTML را به همراه اعداد فارسی شده ارسال می‌کنیم
      const htmlContent = toFaDigits(printRef.current.innerHTML);
      const fileName = `قرارداد-${form.getValues('fullName')}.docx`;
      
      await exportHtmlToDocx(htmlContent, fileName);

    } catch (error: any) {
      toast({ title: 'خطا در ساخت فایل', description: error.message || 'مشکلی در ارتباط با سرور پیش آمد.', variant: 'destructive' });
      console.error("DOCX Export Error:", error);
    }
  };
  /* ---------------------------------- */

  /* ---------- Fetch data ---------- */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [employeeData, branchesData, positionsData, departmentsData] = await Promise.all([
        get(`/employees/${id}`),
        get('/branches'),
        get('/positions'),
        get('/departments'),
      ]);

      let parsedContract: any = employeeData.contract;
      if (typeof parsedContract === 'string') {
        try {
          parsedContract = JSON.parse(parsedContract);
        } catch {
          parsedContract = {};
        }
      }

      const sanitizedData: Employee = {
        ...employeeData,
        email: employeeData.email || '',
        additionalNotes: employeeData.additionalNotes || '',
        militaryStatus: employeeData.militaryStatus || undefined,
        contract: {
          ...EMPLOYER_DEFAULT,
          ...(parsedContract || {}),
        },
      };

      form.reset(sanitizedData);
      setEmployee(sanitizedData);
      setExistingDocuments(employeeData.documents || []);
      setBranches(branchesData);
      setPositions(positionsData);
      setDepartments(departmentsData);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'کارمند یافت نشد یا اطلاعات پایه بارگذاری نشد.',
        variant: 'destructive',
      });
      navigate('/employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);
  /* -------------------------------- */

  /* ---------- Submit ---------- */
  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      for (const key in data) {
        const value = (data as any)[key];
        if (key === 'contract') {
          formData.append('contract', JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      }

      if (photoFile) formData.append('photo', photoFile);
      documentFiles.forEach((file) => formData.append('documents', file));

      await post(`/employees/${id}`, formData, 'PUT');
      toast({ title: 'موفقیت', description: 'اطلاعات کارمند با موفقیت بروزرسانی شد.' });
      navigate('/employees');
    } catch (error) {
      toast({ title: 'خطا', description: 'بروزرسانی اطلاعات با مشکل مواجه شد.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  /* -------------------------------- */

  /* ---------- Handlers ---------- */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'خطا', description: 'حجم عکس نباید بیشتر از ۵ مگابایت باشد', variant: 'destructive' });
      return;
    }
    setPhotoFile(file);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocumentFiles((prev) => [...prev, ...files]);
  };

  const removeNewDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = async (docId: string) => {
    if (!confirm('آیا از حذف این مدرک اطمینان دارید؟')) return;
    try {
      await del(`/documents/${docId}`);
      setExistingDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({ title: 'موفقیت', description: 'مدرک با موفقیت حذف شد.' });
    } catch {
      toast({ title: 'خطا', description: 'حذف مدرک با مشکل مواجه شد.', variant: 'destructive' });
    }
  };

  const handleOpenContract = () => {
    const v = form.getValues();

    if (!v.contract?.salary && v.monthlySalary) {
      form.setValue('contract.salary', `${v.monthlySalary.toLocaleString('fa-IR')} ریال`);
    }
    if (!v.contract?.positionDesc && v.jobTitle) {
      form.setValue('contract.positionDesc', v.jobTitle);
    }
    if (!v.contract?.startDate && v.dateJoined) {
      form.setValue('contract.startDate', v.dateJoined);
    }

    setContractOpen(true);
  };
  /* -------------------------------- */

  const makeContractData = (): ContractData => ({
    employerName: form.getValues('contract.employerName') || '',
    employerNatId: form.getValues('contract.employerNatId') || '',
    employerAddress: form.getValues('contract.employerAddress') || '',
    employerPhone: form.getValues('contract.employerPhone') || '',

    employeeName: form.getValues('fullName') || '',
    employeeNatId: form.getValues('nationalId') || '',
    employeeBirth: formatContractDate(form.getValues('dateOfBirth')),
    employeeAddress: form.getValues('contract.employeeAddress') || '',
    employeePhone: form.getValues('contactNumber') || '',
    employeeEdu: form.getValues('contract.employeeEdu') || '',

    position: form.getValues('jobTitle') || '',
    contractStart: formatContractDate(form.getValues('contract.startDate')),
    contractEnd: formatContractDate(form.getValues('contract.endDate')),

    workingHoursFrom: form.getValues('contract.workFrom') || '',
    workingHoursTo: form.getValues('contract.workTo') || '',

    salary: form.getValues('contract.salary') || '',
    benefits: form.getValues('contract.benefits') || '',
    dutiesText: form.getValues('contract.positionDesc') || '',
    termination: form.getValues('contract.termination') || '',
    other: form.getValues('contract.other') || '',
  });

  if (isLoading) {
    return <div className="text-center p-10">در حال بارگذاری اطلاعات کارمند...</div>;
  }
  
  // بقیه کد بدون تغییر باقی می‌ماند
  // ...
  // ...

  return (
     <div className="space-y-6 animate-fade-in">
       <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold text-foreground">ویرایش اطلاعات: {form.getValues('fullName')}</h1>
         <Button variant="outline" onClick={() => navigate('/employees')} className="gap-2">
           <ArrowRight className="w-4 h-4" /> بازگشت به لیست
         </Button>
       </div>
 
       <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
           {/* ===== اطلاعات شخصی و شغلی ===== */}
           <Card className="glass-card border-primary/20">
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-primary">
                 <User className="w-6 h-6" />
                 اطلاعات شخصی و شغلی
               </CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
               <FormField control={form.control} name="fullName" render={({ field }) => (
                 <FormItem><FormLabel>نام و نام خانوادگی *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="contactNumber" render={({ field }) => (
                 <FormItem><FormLabel>شماره تماس *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="email" render={({ field }) => (
                 <FormItem><FormLabel>ایمیل</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="nationalId" render={({ field }) => (
                 <FormItem><FormLabel>کد ملی *</FormLabel><FormControl><Input maxLength={10} {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                 <FormItem><FormLabel>تاریخ تولد *</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="gender" render={({ field }) => (
                 <FormItem><FormLabel>جنسیت *</FormLabel><FormControl><ToggleGroup type="single" variant="outline" className="grid w-full grid-cols-2" onValueChange={field.onChange} value={field.value}><ToggleGroupItem value="male">مرد</ToggleGroupItem><ToggleGroupItem value="female">زن</ToggleGroupItem></ToggleGroup></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="militaryStatus" render={({ field }) => (
                 <FormItem><FormLabel>وضعیت نظام وظیفه</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={watchGender === 'female'}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب وضعیت" /></SelectTrigger></FormControl><SelectContent><SelectItem value="completed">پایان خدمت</SelectItem><SelectItem value="exempted">معاف</SelectItem><SelectItem value="conscription">مشمول</SelectItem></SelectContent></Select><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="jobTitle" render={({ field }) => (
                 <FormItem><FormLabel>سمت *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب سمت" /></SelectTrigger></FormControl><SelectContent>{positions.map(p => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="department" render={({ field }) => (
                 <FormItem><FormLabel>بخش *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب بخش" /></SelectTrigger></FormControl><SelectContent>{departments.map(dep => (<SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="branch" render={({ field }) => (
                 <FormItem><FormLabel>شعبه *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب شعبه" /></SelectTrigger></FormControl><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="dateJoined" render={({ field }) => (
                 <FormItem><FormLabel>تاریخ استخدام *</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="status" render={({ field }) => (
                 <FormItem><FormLabel>وضعیت *</FormLabel><FormControl><ToggleGroup type="single" variant="outline" className="grid w-full grid-cols-2" onValueChange={field.onChange} value={field.value}><ToggleGroupItem value="active">فعال</ToggleGroupItem><ToggleGroupItem value="inactive">غیرفعال</ToggleGroupItem></ToggleGroup></FormControl><FormMessage /></FormItem>
               )} />
             </CardContent>
           </Card>
 
           {/* ===== اطلاعات حقوق ===== */}
           <Card className="glass-card border-amber-500/20">
             <CardHeader><CardTitle>اطلاعات حقوق</CardTitle></CardHeader>
             <CardContent>
               <FormField control={form.control} name="monthlySalary" render={({ field }) => (
                 <FormItem><FormLabel>حقوق ماهانه (تومان)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>{field.value > 0 && (<p className="text-sm text-muted-foreground pt-2">{formatCurrency(field.value)}</p>)}<FormMessage /></FormItem>
               )} />
             </CardContent>
           </Card>
 
           {/* ===== مدارک ===== */}
           <Card className="glass-card border-gray-500/20">
             <CardHeader><CardTitle className="flex items-center gap-2 text-gray-600"><FileText className="w-5 h-5" />مدارک و فایل‌ها</CardTitle></CardHeader>
             <CardContent className="space-y-6">
               {/* تصویر */}
               <div>
                 <Label className="text-sm font-medium">تصویر کارمند</Label>
                 <div className="mt-2 flex items-center gap-4">
                   <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                     {photoFile ? (<img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />) : employee?.photo ? (<img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${employee.photo}`} alt="Employee" className="w-full h-full object-cover" />) : (<User className="w-10 h-10 text-muted-foreground" />)}
                   </div>
                   <div className="flex-1">
                     <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-upload" />
                     <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"><Upload className="w-4 h-4" />تغییر تصویر</Label>
                     <p className="text-xs text-muted-foreground mt-1">حداکثر ۵ مگابایت - JPG, PNG</p>
                   </div>
                 </div>
               </div>
               <Separator />
               {/* فایل‌ها */}
               <div>
                 <Label className="text-sm font-medium">مدارک</Label>
                 <div className="mt-2 space-y-3">
                   {existingDocuments.map((doc) => (
                     <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
                       <div className="flex items-center gap-3 overflow-hidden"><FileText className="w-4 h-4 text-primary" /><p className="text-sm font-medium truncate">{doc.fileName}</p></div>
                       <div className="flex items-center gap-1">
                         <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${doc.filePath}`} target="_blank" rel="noopener noreferrer"><Button type="button" variant="ghost" size="icon" title="دانلود"><Download className="w-4 h-4" /></Button></a>
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
 
             <Button type="button" variant="secondary" onClick={handleOpenContract} disabled={isLoading} className="gap-2">
               <FileText className="w-4 h-4" />
               قرارداد
             </Button>
 
             <Button type="submit" disabled={isLoading}>
               <Save className="ml-2 h-4 w-4" />
               {isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
             </Button>
           </div>
         </form>
       </Form>
 
       {/* Dialog قرارداد */}
       <Dialog open={contractOpen} onOpenChange={setContractOpen}>
         <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>فرم قرارداد</DialogTitle>
           </DialogHeader>
 
           <Form {...form}>
             <div className="space-y-6">
               <Card className="border-primary/20">
                 <CardHeader><CardTitle className="text-primary">مشخصات کارفرما</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="contract.employerName" render={({ field }) => (<FormItem><FormLabel>نام/شرکت کارفرما</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.employerNatId" render={({ field }) => (<FormItem><FormLabel>شماره ملی / شناسه</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.employerPhone" render={({ field }) => (<FormItem><FormLabel>تلفن کارفرما</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.employerAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>نشانی محل کار</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </CardContent>
               </Card>
 
               <Card className="border-secondary/30">
                 <CardHeader><CardTitle>مشخصات کارمند</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>نام و نام خانوادگی</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="nationalId" render={({ field }) => (<FormItem><FormLabel>کد ملی</FormLabel><FormControl><Input maxLength={10} {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>تاریخ تولد</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="انتخاب تاریخ" /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>شماره تماس</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.employeeAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>نشانی محل سکونت</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.employeeEdu" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>تحصیلات / تخصص</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </CardContent>
               </Card>
 
               <Card className="border-amber-500/20">
                 <CardHeader><CardTitle className="text-amber-600">نوع و موضوع قرارداد</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="contract.startDate" render={({ field }) => (<FormItem><FormLabel>تاریخ شروع قرارداد</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="شروع" /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.endDate" render={({ field }) => (<FormItem><FormLabel>تاریخ پایان قرارداد</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="پایان" /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="jobTitle" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>سمت</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.positionDesc" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>شرح وظایف (خلاصه)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </CardContent>
               </Card>
 
               <Card className="border-blue-500/20">
                 <CardHeader><CardTitle className="text-blue-600">ساعات کار</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="contract.workFrom" render={({ field }) => (<FormItem><FormLabel>از ساعت</FormLabel><FormControl><Input placeholder="08:00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.workTo" render={({ field }) => (<FormItem><FormLabel>تا ساعت</FormLabel><FormControl><Input placeholder="16:30" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </CardContent>
               </Card>
 
               <Card className="border-green-500/20">
                 <CardHeader><CardTitle className="text-green-700">حقوق و مزایا</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="contract.salary" render={({ field }) => (<FormItem><FormLabel>حقوق ماهیانه (ریال)</FormLabel><FormControl><Input {...field} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.benefits" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>سایر مزایا</FormLabel><FormControl><Textarea rows={2} {...field} placeholder="مثال: عیدی کامل، بیمه تکمیلی و ..." /></FormControl><FormMessage /></FormItem>)} />
                 </CardContent>
               </Card>
 
               <Card className="border-gray-500/20">
                 <CardHeader><CardTitle className="text-gray-700">فسخ و سایر موارد</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                   <FormField control={form.control} name="contract.termination" render={({ field }) => (<FormItem><FormLabel>شرایط فسخ</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="contract.other" render={({ field }) => (<FormItem><FormLabel>سایر موارد</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </CardContent>
               </Card>
             </div>
           </Form>
 
           {/* پیش‌نمایش چاپ/Docx */}
           <div ref={printRef} className="mt-8">
             <EmploymentContract data={makeContractData()} />
           </div>
 
           {/* دکمه‌ها */}
           <div className="flex justify-end gap-2 mt-6 no-print">
             <Button className="gap-2" onClick={handlePrint} type="button">
               <Printer className="w-4 h-4" />
               چاپ
             </Button>

             {/* (۴) دکمه جدید برای دانلود */}
             <Button className="gap-2" onClick={handleExportDocx} type="button" variant="outline">
               <FileDown className="w-4 h-4" />
               ذخیره Docx
             </Button>

             <Button variant="secondary" onClick={() => setContractOpen(false)} type="button">
               بستن
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }