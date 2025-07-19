import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Calendar as CalendarIcon,
  DollarSign,
  Calculator,
  Save,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToPersianText, formatCurrency, formatNumber } from '@/lib/number-to-persian';

// **حذف شد:** ایمپورت کامپوننت ناموجود
// import { JalaliDatePicker } from '@/components/ui/jalali-date-picker';

const salarySchema = z.object({
  employeeId: z.string().min(1, 'انتخاب کارمند اجباری است'),
  baseSalary: z.number().min(1, 'حقوق پایه باید بیشتر از صفر باشد'),
  bonuses: z.number().min(0, 'پاداش نمی‌تواند منفی باشد'),
  overtime: z.number().min(0, 'اضافه کاری نمی‌تواند منفی باشد'),
  deductions: z.number().min(0, 'کسورات نمی‌تواند منفی باشد'),
  tax: z.number().min(0, 'مالیات نمی‌تواند منفی باشد'),
  insurance: z.number().min(0, 'بیمه نمی‌تواند منفی باشد'),
  paymentDate: z.date(),
  currency: z.enum(['IRR', 'USD', 'EUR']),
  notes: z.string().optional(),
});

type SalaryForm = z.infer<typeof salarySchema>;

const mockEmployees = [
  { id: 'EMP001', name: 'علی احمدی', currentSalary: 15000000 },
  { id: 'EMP002', name: 'فاطمه رضایی', currentSalary: 12000000 },
  { id: 'EMP003', name: 'محمد کریمی', currentSalary: 18000000 },
  { id: 'EMP004', name: 'زهرا محمدی', currentSalary: 14000000 },
  { id: 'EMP005', name: 'حسین صادقی', currentSalary: 10000000 },
];

interface SalaryManagementProps {
  onSalaryProcessed?: (data: SalaryForm & { finalSalary: number }) => void;
}

export default function SalaryManagement({ onSalaryProcessed }: SalaryManagementProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof mockEmployees[0] | null>(null);

  const form = useForm<SalaryForm>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      employeeId: '',
      baseSalary: 0,
      bonuses: 0,
      overtime: 0,
      deductions: 0,
      tax: 0,
      insurance: 0,
      paymentDate: new Date(),
      currency: 'IRR',
      notes: '',
    },
  });

  const watchedValues = form.watch();
  const finalSalary = watchedValues.baseSalary + watchedValues.bonuses + watchedValues.overtime - watchedValues.deductions - watchedValues.tax - watchedValues.insurance;

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      form.setValue('baseSalary', employee.currentSalary);
    }
  };

  const onSubmit = async (data: SalaryForm) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const salaryData = {
        ...data,
        finalSalary,
      };

      onSalaryProcessed?.(salaryData);
      
      toast({
        title: "موفقیت",
        description: `حقوق ${selectedEmployee?.name} با موفقیت پردازش شد`,
      });

      form.reset();
      setSelectedEmployee(null);
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در پردازش حقوق رخ داده است",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return 'تومان';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            مدیریت حقوق و دستمزد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>انتخاب کارمند *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleEmployeeSelect(value);
                        }} 
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب کارمند" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card">
                          {mockEmployees.map(employee => (
                            <SelectItem key={employee.id} value={employee.id}>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {employee.name} ({employee.id})
                              </div>
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع ارز</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب ارز" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card">
                          <SelectItem value="IRR">تومان (IRR)</SelectItem>
                          <SelectItem value="USD">دلار آمریکا (USD)</SelectItem>
                          <SelectItem value="EUR">یورو (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حقوق پایه *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="15000000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonuses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>پاداش و تشویقی</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="1000000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overtime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اضافه کاری</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="500000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کسورات عمومی</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="200000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مالیات</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="800000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بیمه</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="300000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Date - Corrected */}
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاریخ پرداخت حقوق *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full md:w-1/3 justify-start text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: faIR })
                            ) : (
                              <span>انتخاب تاریخ پرداخت</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Salary Calculation Summary */}
              {(watchedValues.baseSalary > 0 || watchedValues.bonuses > 0 || watchedValues.overtime > 0) && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Calculator className="w-5 h-5" />
                      خلاصه محاسبات حقوق
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>حقوق پایه:</span>
                          <span className="font-medium">{formatNumber(watchedValues.baseSalary)} {getCurrencySymbol(watchedValues.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>پاداش:</span>
                          <span className="text-success">+{formatNumber(watchedValues.bonuses)} {getCurrencySymbol(watchedValues.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>اضافه کاری:</span>
                          <span className="text-success">+{formatNumber(watchedValues.overtime)} {getCurrencySymbol(watchedValues.currency)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>کسورات:</span>
                          <span className="text-destructive">-{formatNumber(watchedValues.deductions)} {getCurrencySymbol(watchedValues.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مالیات:</span>
                          <span className="text-destructive">-{formatNumber(watchedValues.tax)} {getCurrencySymbol(watchedValues.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بیمه:</span>
                          <span className="text-destructive">-{formatNumber(watchedValues.insurance)} {getCurrencySymbol(watchedValues.currency)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>حقوق نهایی:</span>
                        <span className={cn(
                          "text-2xl",
                          finalSalary >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {formatNumber(finalSalary)} {getCurrencySymbol(watchedValues.currency)}
                        </span>
                      </div>
                      {watchedValues.currency === 'IRR' && finalSalary > 0 && (
                        <div className="mt-2 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm text-primary font-medium">
                            معادل حروفی: {formatCurrency(finalSalary)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="submit"
                  disabled={isLoading || finalSalary < 0}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      در حال پردازش...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      پردازش و ثبت حقوق
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}