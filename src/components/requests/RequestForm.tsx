import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, X } from "lucide-react";
import PersianDatePicker from '@/components/PersianDatePicker';
import { postWithFiles } from '@/lib/http';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  fullName: string;
}

const requestSchema = z.object({
  employeeId: z.string().min(1, 'انتخاب کارمند الزامی است'),
  requestType: z.string().min(1, 'نوع درخواست الزامی است'),
  priority: z.string().min(1, 'اولویت الزامی است'),
  description: z.string().min(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.number().optional(),
  reason: z.string().optional()
}).refine((data) => {
  if (data.requestType === 'مساعده مالی' && !data.amount) return false;
  if ((data.requestType === 'مرخصی زایمان' || data.requestType === 'مرخصی استعلاجی' || data.requestType === 'مرخصی استحقاقی') && (!data.startDate || !data.endDate)) return false;
  return true;
}, {
  message: 'فیلدهای مورد نیاز برای نوع درخواست انتخاب شده تکمیل نشده است'
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  employees: Employee[];
  initialData?: any;
}

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, onCancel, employees, initialData }) => {
  const { toast } = useToast();
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  
  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { /* ... بدون تغییر ... */ }
  });

  const watchedRequestType = form.watch('requestType');

  const handleSubmit = async (data: RequestFormData) => {
    const formData = new FormData();

    // <<< اصلاح اصلی: پیدا کردن نام کارمند و افزودن آن به درخواست >>>
    const selectedEmployee = employees.find(emp => emp.id === data.employeeId);
    if (selectedEmployee) {
        formData.append('employeeName', selectedEmployee.fullName);
    }

    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    attachmentFiles.forEach(file => {
      formData.append('attachments', file);
    });

    try {
        await postWithFiles('/requests', formData);
        toast({ title: "موفقیت", description: "درخواست شما با موفقیت ثبت شد." });
        onSubmit();
    } catch (error) {
        toast({ title: "خطا", description: "ثبت درخواست با مشکل مواجه شد.", variant: "destructive" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachmentFiles(prev => [...prev, ...files]);
    }
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" dir="rtl">
        {/* ... بقیه کد JSX بدون تغییر باقی می‌ماند ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات کارمند</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام و نام خانوادگی</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="یک کارمند را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>جزئیات درخواست</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع درخواست</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="نوع درخواست را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="مرخصی زایمان">مرخصی زایمان</SelectItem>
                        <SelectItem value="مرخصی استعلاجی">مرخصی استعلاجی</SelectItem>
                        <SelectItem value="مرخصی استحقاقی">مرخصی استحقاقی</SelectItem>
                        <SelectItem value="مساعده مالی">مساعده مالی</SelectItem>
                        <SelectItem value="درخواست اداری">سایر درخواست‌های اداری</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>اولویت درخواست</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-6 space-x-reverse">
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="low" id="low" /><Label htmlFor="low">کم</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="medium" id="medium" /><Label htmlFor="medium">متوسط</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="high" id="high" /><Label htmlFor="high">بالا</Label></div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {(watchedRequestType === 'مرخصی زایمان' || watchedRequestType === 'مرخصی استعلاجی' || watchedRequestType === 'مرخصی استحقاقی') && (
          <Card>
            <CardHeader><CardTitle>تاریخ‌های مرخصی</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>تاریخ شروع</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="انتخاب تاریخ شروع" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>تاریخ پایان</FormLabel><FormControl><PersianDatePicker value={field.value} onChange={field.onChange} placeholder="انتخاب تاریخ پایان" /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
        )}

        {watchedRequestType === 'مساعده مالی' && (
          <Card>
            <CardHeader><CardTitle>اطلاعات مالی</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>مبلغ (تومان)</FormLabel><FormControl><Input type="number" placeholder="مبلغ را وارد کنید" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="reason" render={({ field }) => (<FormItem><FormLabel>هدف از درخواست</FormLabel><FormControl><Textarea placeholder="هدف و دلیل درخواست را شرح دهید" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>توضیحات درخواست</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>شرح کامل درخواست</FormLabel><FormControl><Textarea placeholder="توضیحات کامل درخواست خود را وارد کنید..." className="min-h-24" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>پیوست‌ها</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="file-upload" className="cursor-pointer"><div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted"><Upload className="h-4 w-4" /><span>افزودن فایل</span></div></Label>
              <Input id="file-upload" type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} />
            </div>
            {attachmentFiles.length > 0 && (
              <div className="space-y-2">
                <Label>فایل‌های پیوست شده:</Label>
                {attachmentFiles.map((file, index) => (<div key={index} className="flex items-center justify-between p-2 border rounded"><span className="text-sm">{file.name}</span><Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}><X className="h-4 w-4" /></Button></div>))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>انصراف</Button>
          <Button type="submit">ثبت درخواست</Button>
        </div>
      </form>
    </Form>
  );
};