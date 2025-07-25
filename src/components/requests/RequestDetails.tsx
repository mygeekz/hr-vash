import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jalaali from 'jalaali-js';
import { 
  User, Calendar, Clock, FileText, Download, Printer, MessageSquare, CheckCircle, 
  XCircle, AlertTriangle, DollarSign, Calendar as CalendarIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// <<< اصلاح ۱: تعریف آدرس پایه سرور بدون /api >>>
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

const convertToJalali = (date: string | null | undefined): string => {
  if (!date) return '';
  const gregorianDate = new Date(date);
  if (isNaN(gregorianDate.getTime())) return '';
  const jDate = jalaali.toJalaali(gregorianDate);
  return `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
};

const convertNumbersToPersian = (text: string): string => {
  if (!text) return '';
  return text.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

interface Attachment {
  fileName: string;
  filePath: string;
  fileType: string;
}

interface Request {
  id: string;
  employeeName: string;
  employeeId: string;
  requestType: string;
  status: 'pending' | 'under-review' | 'approved-manager' | 'rejected-manager' | 'approved-ceo' | 'rejected-ceo';
  priority: 'low' | 'medium' | 'high';
  submissionDate: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  description: string;
  attachments: Attachment[];
  comments: Array<{ author: string; role: string; comment: string; timestamp: string; }>;
  history: Array<{ action: string; author: string; timestamp: string; }>;
}

interface RequestDetailsProps {
  request: Request;
  onUpdateStatus: (requestId: string, newStatus: string, comment?: string) => void;
  userRole: 'employee' | 'admin' | 'manager' | 'ceo';
}

export const RequestDetails: React.FC<RequestDetailsProps> = ({ request, onUpdateStatus, userRole }) => {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      'pending': { label: 'در انتظار بررسی', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      'under-review': { label: 'در حال بررسی', icon: AlertTriangle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      'approved-manager': { label: 'تایید مدیر', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
      'rejected-manager': { label: 'رد توسط مدیر', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
      'approved-ceo': { label: 'تایید نهایی', icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-100' },
      'rejected-ceo': { label: 'رد نهایی', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-100' }
    };
    return statusConfig[status as keyof typeof statusConfig] || { label: status, icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const getPriorityInfo = (priority: string) => {
    const priorityConfig = {
      'low': { label: 'کم', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      'medium': { label: 'متوسط', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      'high': { label: 'بالا', color: 'text-red-600', bgColor: 'bg-red-100' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || { label: priority, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const canTakeAction = () => {
    if (userRole === 'ceo') return true;
    if (userRole === 'admin' && request.status === 'pending') return true;
    if (userRole === 'manager' && (request.status === 'under-review' || request.status === 'pending')) return true;
    return false;
  };

  const getAvailableActions = () => {
    const actions = [];
    if (userRole === 'admin' && request.status === 'pending') { actions.push({ value: 'under-review', label: 'ارسال به مدیر' }); }
    if (userRole === 'manager' && (request.status === 'under-review' || request.status === 'pending')) { actions.push({ value: 'approved-manager', label: 'تایید' }, { value: 'rejected-manager', label: 'رد' }); }
    if (userRole === 'ceo' && !request.status.includes('ceo')) { actions.push({ value: 'approved-ceo', label: 'تایید نهایی' }, { value: 'rejected-ceo', label: 'رد نهایی' }); }
    return actions;
  };

  const handleAction = (action: string) => {
    setPendingAction(action);
    setShowDecisionDialog(true);
  };

  const confirmAction = () => {
    onUpdateStatus(request.id, pendingAction, comment);
    setComment('');
    setShowDecisionDialog(false);
    setPendingAction('');
  };

  // <<< اصلاح ۲: تابع دانلود با آدرس صحیح >>>
  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a');
    // آدرس صحیح برای دانلود فایل از پوشه uploads
    link.href = `${SERVER_BASE_URL}/${attachment.filePath}`;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "دانلود فایل", description: `فایل ${attachment.fileName} شروع به دانلود کرد.` });
  };

  const printRequest = () => {
    const statusInfo = getStatusInfo(request.status);
    const printContent = `
      <html dir="rtl"><head><title>جزئیات درخواست - ${request.id}</title><style>
        body { font-family: Tahoma, Arial, sans-serif; margin: 40px; font-size: 14px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
        h1 { font-size: 24px; } .card { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .card-header { background-color: #f9f9f9; padding: 10px 15px; font-size: 16px; font-weight: bold; }
        .card-content { padding: 15px; } .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #555; } .attachments ul { list-style: none; padding: 0; }
        .attachments li { padding: 5px; border-bottom: 1px dotted #ccc; }
      </style></head><body>
        <div class="header"><h1>جزئیات درخواست ${request.requestType}</h1><h2>شماره: ${request.id}</h2></div>
        <div class="card"><div class="card-header">اطلاعات کارمند</div><div class="card-content">
            <div class="detail-row"><span class="label">نام کارمند:</span> ${request.employeeName}</div>
            <div class="detail-row"><span class="label">شناسه کارمند:</span> ${request.employeeId}</div>
        </div></div>
        <div class="card"><div class="card-header">جزئیات درخواست</div><div class="card-content">
            <div class="detail-row"><span class="label">وضعیت:</span> ${statusInfo.label}</div>
            <div class="detail-row"><span class="label">تاریخ ثبت:</span> ${new Date(request.submissionDate).toLocaleDateString('fa-IR')}</div>
            ${request.startDate ? `<div class="detail-row"><span class="label">تاریخ شروع:</span> ${new Date(request.startDate).toLocaleDateString('fa-IR')}</div>` : ''}
            ${request.endDate ? `<div class="detail-row"><span class="label">تاریخ پایان:</span> ${new Date(request.endDate).toLocaleDateString('fa-IR')}</div>` : ''}
            ${request.amount ? `<div class="detail-row"><span class="label">مبلغ درخواست:</span> ${request.amount.toLocaleString('fa-IR')} تومان</div>` : ''}
        </div></div>
        <div class="card"><div class="card-header">شرح درخواست</div><div class="card-content"><p>${request.description}</p></div></div>
        ${request.attachments && request.attachments.length > 0 ? `<div class="card attachments"><div class="card-header">پیوست‌ها</div><div class="card-content"><ul>${request.attachments.map(file => `<li>${file.fileName}</li>`).join('')}</ul></div></div>` : ''}
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const statusInfo = getStatusInfo(request.status);
  const priorityInfo = getPriorityInfo(request.priority);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{request.requestType}</h2>
            <Badge variant="outline" className={`${statusInfo.color} ${statusInfo.bgColor} border-0`}><StatusIcon className="h-3 w-3 ml-1" />{statusInfo.label}</Badge>
            <Badge variant="outline" className={`${priorityInfo.color} ${priorityInfo.bgColor} border-0`}>{priorityInfo.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">شماره درخواست: {request.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printRequest}><Printer className="h-4 w-4 ml-2" />چاپ</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />اطلاعات کارمند</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div><Label className="text-sm text-muted-foreground">نام کارمند</Label><p className="font-medium">{request.employeeName}</p></div>
              <div><Label className="text-sm text-muted-foreground">شناسه کارمند</Label><p className="font-medium">{request.employeeId}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />جزئیات درخواست</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm text-muted-foreground">تاریخ ثبت</Label><div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /><p className="font-medium">{convertNumbersToPersian(convertToJalali(request.submissionDate))}</p></div></div>
                {request.startDate && (<div><Label className="text-sm text-muted-foreground">تاریخ شروع</Label><div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /><p className="font-medium">{convertNumbersToPersian(convertToJalali(request.startDate))}</p></div></div>)}
                {request.endDate && (<div><Label className="text-sm text-muted-foreground">تاریخ پایان</Label><div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /><p className="font-medium">{convertNumbersToPersian(convertToJalali(request.endDate))}</p></div></div>)}
                {request.amount && (<div><Label className="text-sm text-muted-foreground">مبلغ درخواست</Label><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><p className="font-medium">{request.amount.toLocaleString('fa-IR')} تومان</p></div></div>)}
              </div>
              <p className="text-sm leading-relaxed">{request.description}</p>
            </CardContent>
          </Card>
          
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>پیوست‌ها</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{attachment.fileName}</span></div>
                      <Button variant="outline" size="sm" onClick={() => downloadAttachment(attachment)}><Download className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {canTakeAction() && (
            <Card>
              <CardHeader><CardTitle>اقدامات</CardTitle></CardHeader>
              <CardContent className="space-y-3">{getAvailableActions().map((action) => (<Button key={action.value} variant={action.value.includes('approved') ? 'default' : 'destructive'} className="w-full" onClick={() => handleAction(action.value)}>{action.label}</Button>))}</CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />نظرات و بازخورد</CardTitle></CardHeader>
            <CardContent><ScrollArea className="h-40 w-full"><div className="space-y-3">
              {request.comments.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">هنوز نظری ثبت نشده است</p>) : (request.comments.map((comment, index) => (<div key={index} className="p-3 bg-muted rounded-lg"><div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">{comment.author}</span><span className="text-xs text-muted-foreground">{comment.timestamp}</span></div><p className="text-sm">{comment.comment}</p></div>)))}
            </div></ScrollArea></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>تاریخچه تغییرات</CardTitle></CardHeader>
            <CardContent><ScrollArea className="h-32 w-full"><div className="space-y-3">
              {request.history.map((historyItem, index) => (<div key={index} className="flex items-center gap-3 text-sm"><div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" /><div className="flex-1"><p>{historyItem.action}</p><p className="text-xs text-muted-foreground">{historyItem.author} - {historyItem.timestamp}</p></div></div>))}
            </div></ScrollArea></CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>تایید اقدام</DialogTitle><DialogDescription>آیا از انجام این اقدام اطمینان دارید؟ در صورت نیاز نظر خود را وارد کنید.</DialogDescription></DialogHeader>
          <div className="space-y-4"><div><Label htmlFor="comment">نظر (اختیاری)</Label><Textarea id="comment" placeholder="نظر یا توضیحات اضافی..." value={comment} onChange={(e) => setComment(e.target.value)} className="mt-2" /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDecisionDialog(false)}>انصراف</Button><Button onClick={confirmAction}>تایید</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};