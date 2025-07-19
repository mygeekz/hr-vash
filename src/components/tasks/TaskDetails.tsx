import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Image, Calendar, User, Building, Flag, Clock } from "lucide-react";
import jalaali from 'jalaali-js';

// تابع برای تبدیل تاریخ میلادی به شمسی
const convertToJalali = (date: string) => {
  const gregorianDate = new Date(date);
  const jDate = jalaali.toJalaali(gregorianDate.getFullYear(), gregorianDate.getMonth() + 1, gregorianDate.getDate());
  return `${jDate.jd}/${jDate.jm}/${jDate.jy}`; // خروجی تاریخ شمسی
};

// تابع برای تبدیل اعداد انگلیسی به فارسی
const convertNumbersToPersian = (text: string) => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return text.replace(/\d/g, (match) => persianNumbers[parseInt(match)]);
};

interface Task {
  id: string;
  employeeName: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  department: string;
  attachments: File[];
  completedDate?: string;
}

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const getStatusBadge = (status: Task["status"]) => {
    const statusConfig = {
      pending: { label: "در انتظار", variant: "secondary" as const },
      "in-progress": { label: "در حال انجام", variant: "default" as const },
      completed: { label: "تکمیل شده", variant: "outline" as const },
    };
    return statusConfig[status];
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    const priorityConfig = {
      low: { label: "کم", variant: "outline" as const },
      medium: { label: "متوسط", variant: "secondary" as const },
      high: { label: "بالا", variant: "destructive" as const },
    };
    return priorityConfig[priority];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>جزئیات وظیفه - ${task.id}</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .task-info { margin-bottom: 20px; }
            .task-info h3 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .attachments { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>جزئیات وظیفه</h1>
            <h2>${task.id}</h2>
          </div>
          
          <div class="task-info">
            <h3>اطلاعات عمومی</h3>
            <div class="detail-row"><span class="label">نام کارمند:</span> ${task.employeeName}</div>
            <div class="detail-row"><span class="label">بخش:</span> ${task.department}</div>
            <div class="detail-row"><span class="label">وضعیت:</span> ${getStatusBadge(task.status).label}</div>
            <div class="detail-row"><span class="label">اولویت:</span> ${getPriorityBadge(task.priority).label}</div>
          </div>
          
          <div class="task-info">
            <h3>تاریخ‌ها</h3>
            <div class="detail-row"><span class="label">تاریخ تعیین:</span> ${convertNumbersToPersian(convertToJalali(task.assignedDate))}</div>
            <div class="detail-row"><span class="label">تاریخ تحویل:</span> ${convertNumbersToPersian(convertToJalali(task.dueDate))}</div>
            ${task.completedDate ? `<div class="detail-row"><span class="label">تاریخ تکمیل:</span> ${convertNumbersToPersian(convertToJalali(task.completedDate))}</div>` : ''}
          </div>
          
          <div class="task-info">
            <h3>شرح وظیفه</h3>
            <p>${task.description}</p>
          </div>
          
          ${task.attachments.length > 0 ? `
            <div class="attachments">
              <h3>پیوست‌ها</h3>
              <ul>
                ${task.attachments.map(file => `<li>${file.name}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{task.id}</h2>
          <div className="flex gap-2 mt-2">
            <Badge variant={getStatusBadge(task.status).variant}>
              {getStatusBadge(task.status).label}
            </Badge>
            <Badge variant={getPriorityBadge(task.priority).variant}>
              {getPriorityBadge(task.priority).label}
            </Badge>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline">
          چاپ جزئیات
        </Button>
      </div>

      <Separator />

      {/* Task Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اطلاعات کارمند
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium text-muted-foreground">نام کارمند:</span>
              <div className="mt-1">{task.employeeName}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">بخش:</span>
              <div className="mt-1 flex items-center gap-2">
                <Building className="h-4 w-4" />
                {task.department}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تاریخ‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium text-muted-foreground">تاریخ تعیین:</span>
              <div className="mt-1">{convertNumbersToPersian(convertToJalali(task.assignedDate))}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">تاریخ تحویل:</span>
              <div className="mt-1">{convertNumbersToPersian(convertToJalali(task.dueDate))}</div>
            </div>
            {task.completedDate && (
              <div>
                <span className="font-medium text-muted-foreground">تاریخ تکمیل:</span>
                <div className="mt-1 text-green-600">{convertNumbersToPersian(convertToJalali(task.completedDate))}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Description */}
      <Card>
        <CardHeader>
          <CardTitle>شرح وظیفه</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{task.description}</p>
        </CardContent>
      </Card>

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>پیوست‌های فایل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {task.attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.name)}
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}
