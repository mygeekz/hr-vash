import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReactToPrint } from "react-to-print";
import EmploymentContract, { ContractData } from "@/components/contract/EmploymentContract";

import { postWithFiles, get } from "@/lib/http";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatContractDate } from '@/lib/format-contract-date';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

import {
  User,
  ArrowRight,
  Save,
  X,
  Plus,
  Download,
  Printer,
  FileText,
  DollarSign,
  Upload,
  Phone,
  ScanLine,
  Building,
  CalendarDays,
  UserCheck,
  ShieldQuestion,
  Cake,
  ClipboardList,
  Trash2,
} from "lucide-react";

import { formatCurrency } from "@/lib/number-to-persian";
import PersianDatePicker from "@/components/PersianDatePicker";
// ---- Persian digits helper (local-only) ----
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFaDigits = (val: any) =>
  String(val ?? '').replace(/\d/g, d => PERSIAN_DIGITS[Number(d)]);

/* ===================== Types ===================== */
interface Branch { id: string; name: string; }
interface Position { id: string; title: string; }
interface Department { id: string; name: string; }

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: Date;
}

/* ===================== Schemas ===================== */
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

const addEmployeeSchema = z
  .object({
    fullName: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
    nationalId: z.string().regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد"),
    employeeId: z.string().min(3, "کد کارمندی باید حداقل ۳ کاراکتر باشد"),
    jobTitle: z.string().min(1, "انتخاب سمت اجباری است"),
    department: z.string().min(1, "انتخاب بخش اجباری است"),
    branch: z.string().min(1, "انتخاب شعبه اجباری است"),
    contactNumber: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر وارد کنید"),
    dateOfBirth: z.string().min(1, "تاریخ تولد اجباری است"),
    dateJoined: z.string().min(1, "تاریخ استخدام اجباری است"),
    monthlySalary: z.number().min(1, "مبلغ حقوق باید بیشتر از صفر باشد"),
    status: z.enum(["active", "inactive"]),
    gender: z.enum(["male", "female"], { message: "انتخاب جنسیت اجباری است" }),
    militaryStatus: z.enum(["completed", "exempted", "conscription"]).optional(),
    additionalNotes: z.string().optional(),
    tasks: z
      .array(
        z.object({
          title: z.string().min(1, "عنوان وظیفه اجباری است"),
          description: z.string().min(1, "توضیحات وظیفه اجباری است"),
          status: z.enum(["pending", "in_progress", "completed"]),
          assignedDate: z.string().min(1, "تاریخ تخصیص اجباری است"),
          dueDate: z.string().optional(),
        })
      )
      .optional(),
  })
  .extend({
    contract: contractSchema.optional(),
  });

export type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

/* ===================== Employer Defaults ===================== */
const EMPLOYER_DEFAULT = {
  employerName: "حمیدرضا وش نیا",
  employerNatId: "0065328205",
  employerAddress:
    "شهر قدس- سرخه حصار – خیابان امام علی - روبه‌روی پارک سرخه حصار – بازرگانی وش نیا",
  employerPhone: "09121504859",
};

/* ===================== Component ===================== */
export default function AddEmployee() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);

  const [contractOpen, setContractOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const form = useForm<AddEmployeeForm>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: "",
      nationalId: "",
      employeeId: "",
      jobTitle: "",
      department: "",
      branch: "",
      contactNumber: "",
      dateOfBirth: "",
      dateJoined: "",
      monthlySalary: 0,
      status: "active",
      gender: "male",
      militaryStatus: "completed",
      additionalNotes: "",
      tasks: [],
      contract: {
        ...EMPLOYER_DEFAULT,
        startDate: "",
        endDate: "",
        workFrom: "",
        workTo: "",
        salary: "",
        positionDesc: "",
        benefits: "",
        termination: "",
        other: "",
        employeeAddress: "",
        employeeEdu: "",
      },
    },
  });

  const watchGender = form.watch("gender");

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  /* ---------- Print ---------- */
  const printContract = useReactToPrint({
    content: () => printRef.current!,
    documentTitle: `قرارداد-${form.getValues("fullName")}`,
    removeAfterPrint: true,
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print { .no-print{display:none!important;} }
    `,
    onBeforeGetContent: () =>
      new Promise<void>((resolve) => {
        // فرصت برای اعمال آخرین setValue ها
        requestAnimationFrame(() => resolve());
      }),
  });

  const handlePrintClick = () => {
    if (!printRef.current) {
      console.warn("printRef is null!");
      return;
    }
    printContract();
  };
  /* --------------------------- */

  // دریافت اطلاعات پایه
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, positionsData, departmentsData] = await Promise.all([
          get("/branches"),
          get("/positions"),
          get("/departments"),
        ]);
        setBranches(branchesData);
        setPositions(positionsData);
        setDepartments(departmentsData);
      } catch {
        toast({
          title: "خطا در دریافت اطلاعات پایه",
          description: "لیست شعب، سمت‌ها و بخش‌ها دریافت نشد.",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, []);

  // باز کردن مودال و پر کردن خودکار برخی فیلدها
  const handleOpenContract = () => {
    const v = form.getValues();
    const salaryStr =
      v.monthlySalary && v.monthlySalary > 0
        ? `${v.monthlySalary.toLocaleString("fa-IR")} ریال`
        : "";

    if (!v.contract?.salary) form.setValue("contract.salary", salaryStr);
    if (!v.contract?.positionDesc) form.setValue("contract.positionDesc", v.jobTitle);
    if (!v.contract?.startDate) form.setValue("contract.startDate", v.dateJoined);

    setContractOpen(true);
  };

  const onSubmit = async (data: AddEmployeeForm) => {
    setIsLoading(true);
    const fd = new FormData();

    Object.entries(data).forEach(([k, v]) => {
      if (k === "tasks" && Array.isArray(v)) fd.append(k, JSON.stringify(v));
      else if (k === "contract") fd.append("contract", JSON.stringify(v));
      else if (v !== undefined && v !== null) fd.append(k, String(v));
    });

    if (photoFile) fd.append("photo", photoFile);
    documentFiles.forEach((f) => fd.append("documents", f));

    try {
      await postWithFiles("/employees", fd);
      toast({ title: "موفقیت", description: "کارمند جدید با موفقیت اضافه شد" });
      navigate("/employees");
    } catch (error) {
      toast({ title: "خطا", description: "ثبت اطلاعات با مشکل مواجه شد", variant: "destructive" });
      console.error("Failed to create employee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطا",
        description: "حجم فایل باید کمتر از ۵ مگابایت باشد",
        variant: "destructive",
      });
      return;
    }
    setPhotoFile(file);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: FileAttachment[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadDate: new Date(),
    }));

    setDocumentFiles((prev) => [...prev, ...files]);
    setFileAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeDocument = (index: number) => {
    setDocumentFiles((p) => p.filter((_, i) => i !== index));
    setFileAttachments((p) => p.filter((_, i) => i !== index));
  };

  const downloadFile = (a: FileAttachment) => {
    const link = document.createElement("a");
    link.href = a.url;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printFile = (a: FileAttachment) => {
    if (a.type.includes("image") || a.type.includes("pdf")) {
      const w = window.open(a.url, "_blank");
      if (w) w.onload = () => w.print();
    }
  };

  const addNewTask = () => {
    appendTask({
      title: "",
      description: "",
      status: "pending",
      assignedDate: "",
      dueDate: "",
    });
  };

  const makeContractData = (): ContractData => ({
    employerName: form.getValues("contract.employerName") || "",
    employerNatId: form.getValues("contract.employerNatId") || "",
    employerAddress: form.getValues("contract.employerAddress") || "",
    employerPhone: form.getValues("contract.employerPhone") || "",

    employeeName: form.getValues("fullName") || "",
    employeeNatId: form.getValues("nationalId") || "",
    employeeBirth: formatContractDate(form.getValues('dateOfBirth')),
    employeeAddress: form.getValues("contract.employeeAddress") || "",
    employeePhone: form.getValues("contactNumber") || "",
    employeeEdu: form.getValues("contract.employeeEdu") || "",

    position: form.getValues("jobTitle") || "",
    contractStart: formatContractDate(form.getValues('contract.startDate')),
    contractEnd: formatContractDate(form.getValues('contract.endDate')),

    workingHoursFrom: form.getValues("contract.workFrom") || "",
    workingHoursTo: form.getValues("contract.workTo") || "",

    salary: form.getValues("contract.salary") || "",
    benefits: form.getValues("contract.benefits") || "",
    dutiesText: form.getValues("contract.positionDesc") || "",
    termination: form.getValues("contract.termination") || "",
    other: form.getValues("contract.other") || "",
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">افزودن کارمند جدید</h1>
          <p className="text-muted-foreground">اطلاعات کارمند جدید را برای ثبت در سیستم وارد کنید.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/employees")} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          بازگشت به لیست
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ===== اطلاعات شخصی ===== */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <User className="w-6 h-6" />
                اطلاعات شخصی
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      نام و نام خانوادگی *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: علی محمدی" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Cake className="w-4 h-4" />
                      تاریخ تولد *
                    </FormLabel>
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
                )}
              />

              <FormField
                control={form.control}
                name="dateJoined"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      تاریخ استخدام *
                    </FormLabel>
                    <FormControl>
                      <PersianDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="انتخاب تاریخ"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      شماره تماس *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 09123456789" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ScanLine className="w-4 h-4" />
                      کد ملی *
                    </FormLabel>
                    <FormControl>
                      <Input maxLength={10} placeholder="کد ملی ۱۰ رقمی" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <ToggleGroupItem
                          value="male"
                          aria-label="انتخاب مرد"
                          className="w-full data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                        >
                          مرد
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="female"
                          aria-label="انتخاب زن"
                          className="w-full data-[state=on]:bg-pink-100 data-[state=on]:text-pink-600"
                        >
                          زن
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="militaryStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ShieldQuestion className="w-4 h-4" />
                      وضعیت نظام وظیفه
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || watchGender === "female"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب وضعیت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card">
                        <SelectItem value="completed">پایان خدمت</SelectItem>
                        <SelectItem value="exempted">معاف از خدمت</SelectItem>
                        <SelectItem value="conscription">مشمول</SelectItem>
                      </SelectContent>
                    </Select>
                    {watchGender === "female" && (
                      <p className="text-xs text-muted-foreground mt-1">این فیلد برای خانم‌ها غیرفعال است.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      کد کارمندی *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: EMP001" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سمت *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب سمت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card">
                        {positions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.title}>
                            {pos.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بخش *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب بخش" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card">
                        {departments.map((dep) => (
                          <SelectItem key={dep.id} value={dep.name}>
                            {dep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      شعبه کاری *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب شعبه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card">
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <ToggleGroupItem
                          value="active"
                          aria-label="انتخاب فعال"
                          className="w-full data-[state=on]:bg-green-100 data-[state=on]:text-green-700"
                        >
                          فعال
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="inactive"
                          aria-label="انتخاب غیرفعال"
                          className="w-full data-[state=on]:bg-red-100 data-[state=on]:text-red-700"
                        >
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

          {/* ===== حقوق و مزایا ===== */}
          <Card className="glass-card border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <DollarSign className="w-6 h-6" />
                اطلاعات حقوق و دستمزد
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="monthlySalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>میزان حقوق ماهانه (تومان) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10,000,000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading}
                        min="0"
                      />
                    </FormControl>
                    {field.value > 0 && (
                      <div className="mt-2 p-3 bg-amber-500/10 rounded-lg text-amber-700">
                        <p className="text-sm font-medium">معادل حروفی: {formatCurrency(field.value)}</p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات و اطلاعات اضافی</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اطلاعات اضافی درباره کارمند، تخصص‌ها، سابقه کار و سایر موارد..."
                        {...field}
                        disabled={isLoading}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ===== وظایف ===== */}
          <Card className="glass-card border-indigo-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-600">
                <ClipboardList className="w-5 h-5" />
                وظایف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md border border-border/50 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute left-2 top-2 text-destructive"
                    size="icon"
                    onClick={() => removeTask(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <FormField
                    control={form.control}
                    name={`tasks.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان وظیفه *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`tasks.${index}.assignedDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ تخصیص *</FormLabel>
                        <FormControl>
                          <PersianDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="انتخاب تاریخ"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`tasks.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>توضیحات *</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`tasks.${index}.dueDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>موعد انجام</FormLabel>
                        <FormControl>
                          <PersianDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="انتخاب تاریخ"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`tasks.${index}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وضعیت</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب وضعیت" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card">
                            <SelectItem value="pending">در انتظار</SelectItem>
                            <SelectItem value="in_progress">در حال انجام</SelectItem>
                            <SelectItem value="completed">انجام‌شده</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addNewTask} disabled={isLoading} className="gap-2">
                <Plus className="w-4 h-4" /> افزودن وظیفه
              </Button>
            </CardContent>
          </Card>

          {/* ===== مدارک و فایل‌ها ===== */}
          <Card className="glass-card border-gray-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <FileText className="w-5 h-5" />
                مدارک و فایل‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* تصویر */}
              <div>
                <Label className="text-sm font-medium">تصویر کارمند</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                    {photoFile ? (
                      <img
                        src={URL.createObjectURL(photoFile)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      انتخاب تصویر
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">حداکثر ۵ مگابایت - فرمت JPG، PNG</p>
                  </div>
                </div>
              </div>

              {/* فایل‌ها */}
              <div>
                <Label className="text-sm font-medium">مدارک (قرارداد، رزومه، و...)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleDocumentChange}
                    className="hidden"
                    id="documents-upload"
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="documents-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    انتخاب فایل‌ها
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    فرمت PDF، Word، تصاویر - چندین فایل قابل انتخاب
                  </p>

                  {fileAttachments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-medium">فایل‌های ضمیمه شده:</h4>
                      {fileAttachments.map((attachment, index) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{attachment.name}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>{format(attachment.uploadDate, "PPP", { locale: faIR })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(attachment)}
                              disabled={isLoading}
                              title="دانلود"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => printFile(attachment)}
                              disabled={isLoading}
                              title="چاپ"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                              disabled={isLoading}
                              title="حذف"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== دکمه‌های فرم اصلی ===== */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/employees")} disabled={isLoading}>
              انصراف
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleOpenContract}
              disabled={isLoading}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              قرارداد
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-primary hover:opacity-90 shadow-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  در حال ذخیره...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  ذخیره کارمند
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* ===== Dialog قرارداد ===== */}
      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>فرم قرارداد</DialogTitle>
          </DialogHeader>

          {/* فرم قرارداد */}
          <Form {...form}>
            <div className="space-y-6">
              {/* 1. مشخصات کارفرما */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">مشخصات کارفرما</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contract.employerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام/شرکت کارفرما</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contract.employerNatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره ملی / شناسه</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contract.employerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تلفن کارفرما</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contract.employerAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>نشانی محل کار</FormLabel>
                        <FormControl><Textarea rows={2} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2. مشخصات کارمند */}
              <Card className="border-secondary/30">
                <CardHeader>
                  <CardTitle>مشخصات کارمند</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>نام و نام خانوادگی</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nationalId" render={({ field }) => (
                    <FormItem><FormLabel>کد ملی</FormLabel>
                      <FormControl><Input maxLength={10} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem><FormLabel>تاریخ تولد</FormLabel>
                      <FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="انتخاب تاریخ" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem><FormLabel>شماره تماس</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="contract.employeeAddress" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>نشانی محل سکونت</FormLabel>
                      <FormControl><Textarea rows={2} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="contract.employeeEdu" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>تحصیلات / تخصص</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* 3. نوع و موضوع قرارداد */}
              <Card className="border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-amber-600">نوع و موضوع قرارداد</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contract.startDate" render={({ field }) => (
                    <FormItem><FormLabel>تاریخ شروع قرارداد</FormLabel>
                      <FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="شروع" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contract.endDate" render={({ field }) => (
                    <FormItem><FormLabel>تاریخ پایان قرارداد</FormLabel>
                      <FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="پایان" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="jobTitle" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>سمت</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contract.positionDesc" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>شرح وظایف (خلاصه)</FormLabel>
                      <FormControl><Textarea rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* 4. ساعات کار */}
              <Card className="border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-blue-600">ساعات کار</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contract.workFrom" render={({ field }) => (
                    <FormItem><FormLabel>از ساعت</FormLabel>
                      <FormControl><Input placeholder="08:00" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contract.workTo" render={({ field }) => (
                    <FormItem><FormLabel>تا ساعت</FormLabel>
                      <FormControl><Input placeholder="16:30" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* 5. حقوق و مزایا */}
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-700">حقوق و مزایا</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contract.salary" render={({ field }) => (
                    <FormItem><FormLabel>حقوق ماهیانه (ریال)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contract.benefits" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>سایر مزایا</FormLabel>
                      <FormControl><Textarea rows={2} {...field} placeholder="مثال: عیدی کامل، بیمه تکمیلی و ..." /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* 6. فسخ و سایر موارد */}
              <Card className="border-gray-500/20">
                <CardHeader>
                  <CardTitle className="text-gray-700">فسخ و سایر موارد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="contract.termination" render={({ field }) => (
                    <FormItem><FormLabel>شرایط فسخ</FormLabel>
                      <FormControl><Textarea rows={2} {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contract.other" render={({ field }) => (
                    <FormItem><FormLabel>سایر موارد</FormLabel>
                      <FormControl><Textarea rows={2} {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
          </Form>

          {/* پیش‌نمایش قابل چاپ */}
          <div ref={printRef} className="mt-8">
            <EmploymentContract data={makeContractData()} />
          </div>

          {/* دکمه‌های چاپ و بستن */}
          <div className="flex justify-end gap-2 mt-6 no-print">
            <Button type="button" className="gap-2 no-print" onClick={handlePrintClick}>
              <Printer className="w-4 h-4" />
              چاپ
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
