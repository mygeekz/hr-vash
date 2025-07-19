import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// **حذف شد:** ایمپورت کامپوننت ناموجود
// import { JalaliDatePicker } from '@/components/ui/jalali-date-picker';

const salesReportSchema = z.object({
  employeeName: z.string().min(1, 'نام کارمند الزامی است'),
  branchName: z.string().min(1, 'نام شعبه الزامی است'),
  shiftTime: z.enum(['morning', 'evening']),
  reportDate: z.date(),
  salesAmount: z.string().min(1, 'مبلغ فروش الزامی است'),
  customerCount: z.string().min(1, 'تعداد مشتری الزامی است'),
});

type SalesReportForm = z.infer<typeof salesReportSchema>;

interface SalesReportFormProps {
  open: boolean;
  onClose: () => void;
  userRole: string;
}

export const SalesReportForm = ({ open, onClose, userRole }: SalesReportFormProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const form = useForm<SalesReportForm>({
    resolver: zodResolver(salesReportSchema),
    defaultValues: {
      employeeName: '',
      branchName: '',
      salesAmount: '',
      customerCount: '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('فرمت فایل مجاز نیست.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('حجم فایل نباید بیشتر از 5 مگابایت باشد');
        return;
      }
      
      setUploadedFile(file);
      toast.success('فایل با موفقیت انتخاب شد');
    }
  };

  const onSubmit = (data: SalesReportForm) => {
    console.log('Sales Report Data:', data);
    console.log('Uploaded File:', uploadedFile);
    toast.success('گزارش فروش با موفقیت ثبت شد');
    form.reset();
    setUploadedFile(null);
    onClose();
  };

  const employees = [
    { value: 'emp1', label: 'احمد محمدی' },
    { value: 'emp2', label: 'فاطمه احمدی' },
    { value: 'emp3', label: 'علی رضایی' },
  ];

  const branches = [
    { value: 'branch1', label: 'شعبه مرکزی' },
    { value: 'branch2', label: 'شعبه شمال' },
    { value: 'branch3', label: 'شعبه جنوب' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ثبت گزارش فروش</DialogTitle>
          <DialogDescription>
            گزارش فروش روزانه خود را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Other fields remain unchanged */}
              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کارمند</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کارمند" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.value} value={emp.value}>
                            {emp.label}
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
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام شعبه</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب شعبه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.label}
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
                name="shiftTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوبت کاری</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوبت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">صبح</SelectItem>
                        <SelectItem value="evening">عصر</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* **تغییر اصلی اینجاست** */}
              <FormField
                control={form.control}
                name="reportDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاریخ گزارش</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "yyyy/MM/dd")
                            ) : (
                              <span>انتخاب تاریخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Other fields remain unchanged */}
              <FormField
                control={form.control}
                name="salesAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ فروش (تومان)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: 1000000"
                        {...field}
                        type="number"
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد مشتری</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: 15"
                        {...field}
                        type="number"
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section - No change needed */}
            <div className="space-y-4">
              <FormLabel>بارگذاری فایل گزارش</FormLabel>
              {/* ... file upload JSX ... */}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                انصراف
              </Button>
              <Button type="submit">
                ثبت گزارش
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};