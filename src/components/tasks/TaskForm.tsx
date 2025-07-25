import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PersianDatePicker from "@/components/PersianDatePicker";
import { toJalaliDisplay } from "@/utils/date";

// اینترفیس‌ها بدون فیلد پیوست‌ها
interface Employee {
  id: string;
  fullName: string;
}

interface Task {
  id: string;
  employeeName: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  completedDate?: string;
}

// Schemaی اعتبارسنجی بدون فیلد بخش
const taskSchema = z.object({
  employeeName: z.string().min(1, "نام کارمند الزامی است"),
  description: z.string().min(1, "شرح وظیفه الزامی است"),
  assignedDate: z.string().min(1, "تاریخ تعیین الزامی است"),
  dueDate: z.string().min(1, "تاریخ تحویل الزامی است"),
  status: z.enum(["pending", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Props کامپوننت به‌روز شده
interface TaskFormProps {
  task?: Task | null;
  employees: Employee[];
  onSubmit: (data: Omit<Task, "id">) => void;
  onCancel: () => void;
}

export function TaskForm({ task, employees, onSubmit, onCancel }: TaskFormProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      employeeName: task?.employeeName || "",
      description: task?.description || "",
      assignedDate: task?.assignedDate || "",
      dueDate: task?.dueDate || "",
      status: task?.status || "pending",
      priority: task?.priority || "medium",
    },
  });

  const handleSubmit = (data: TaskFormData) => {
    const submissionData = {
      ...data,
      ...(data.status === "completed" && !task?.completedDate && {
        completedDate: toJalaliDisplay(new Date())
      }),
    };
    onSubmit(submissionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="employeeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام کارمند *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کارمند" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.fullName}>
                      {employee.fullName}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شرح وظیفه *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="شرح کاملی از وظیفه ارائه دهید..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="assignedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ تعیین *</FormLabel>
                <FormControl>
                  <PersianDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="انتخاب تاریخ تعیین"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ تحویل *</FormLabel>
                <FormControl>
                  <PersianDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="انتخاب تاریخ تحویل"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وضعیت *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="in-progress">در حال انجام</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
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
              <FormItem>
                <FormLabel>اولویت *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب اولویت" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">کم</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">بالا</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit">
            {task ? "بروزرسانی وظیفه" : "ایجاد وظیفه"}
          </Button>
        </div>
      </form>
    </Form>
  );
}