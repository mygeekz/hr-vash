// src/pages/Requests.tsx
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestDetails } from "@/components/requests/RequestDetails";
import { RequestDashboard } from "@/components/requests/RequestDashboard";

// ⬇️ تغییر آیکن‌ها: Download حذف شد، FileSpreadsheet اضافه شد
import { Plus, Search, Filter, Eye, Edit, Trash2, FileSpreadsheet } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { get, post, del } from '@/lib/http';
import jalaali from 'jalaali-js';

/* ------------------ Helpers ------------------ */
const convertToJalali = (date: string | null | undefined): string => {
  if (!date) return '';
  const gregorianDate = new Date(date);
  if (isNaN(gregorianDate.getTime())) return 'تاریخ نامعتبر';
  const jDate = jalaali.toJalaali(gregorianDate.getFullYear(), gregorianDate.getMonth() + 1, gregorianDate.getDate());
  return `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
};

const convertNumbersToPersian = (text: string): string => {
  if (!text) return '';
  const persianNumbers = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return text.replace(/\d/g, d => persianNumbers[+d]);
};

/* ------------------ Types ------------------ */
interface Employee { id: string; fullName: string; }

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

/* دسته‌بندی وضعیت‌ها */
const PENDING_STATUSES = ['pending', 'under-review'];
const COMPLETED_STATUSES = ['approved-manager', 'rejected-manager', 'approved-ceo', 'rejected-ceo'];

const Requests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userRole] = useState<'employee' | 'admin' | 'manager' | 'ceo'>('admin');
  const [activeTab, setActiveTab] = useState("dashboard");

  /* ------------------ Fetch ------------------ */
  const fetchData = async () => {
    try {
      const [requestsData, employeesData] = await Promise.all([
        get('/requests'),
        get('/employees')
      ]);
      setRequests(requestsData);
      setEmployees(employeesData);
    } catch (error) {
      toast({ title: "خطا", description: "دریافت اطلاعات اولیه با مشکل مواجه شد", variant: "destructive" });
    }
  };
  useEffect(() => { fetchData(); }, []);

  /* ------------------ Badges ------------------ */
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending':          { label: 'در انتظار',     variant: 'secondary' as const },
      'under-review':     { label: 'در حال بررسی',   variant: 'default'   as const },
      'approved-manager': { label: 'تایید مدیر',     variant: 'default'   as const },
      'rejected-manager': { label: 'رد مدیر',        variant: 'destructive' as const },
      'approved-ceo':     { label: 'تایید نهایی',    variant: 'default'   as const },
      'rejected-ceo':     { label: 'رد نهایی',       variant: 'destructive' as const }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low':    { label: 'کم',      variant: 'outline'     as const },
      'medium': { label: 'متوسط',   variant: 'secondary'   as const },
      'high':   { label: 'بالا',    variant: 'destructive' as const }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { label: priority, variant: 'outline' };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  /* ------------------ Filters ------------------ */
  const filteredRequests = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return requests.filter(r => {
      const matchesSearch =
        (r.employeeName || '').toLowerCase().includes(lower) ||
        (r.requestType  || '').toLowerCase().includes(lower) ||
        (r.id           || '').toLowerCase().includes(lower);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesType   = typeFilter   === "all" || r.requestType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const pendingRequests   = useMemo(() => filteredRequests.filter(r => PENDING_STATUSES.includes(r.status)), [filteredRequests]);
  const completedRequests = useMemo(() => filteredRequests.filter(r => COMPLETED_STATUSES.includes(r.status)), [filteredRequests]);

  /* ------------------ Actions ------------------ */
  const handleCreateRequest = async () => {
    setIsFormOpen(false);
    fetchData();
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string, comment?: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const statusLabel = getStatusBadge(newStatus).props.children;
    const updatedRequest: Request = {
      ...request,
      status: newStatus as Request['status'],
      comments: comment
        ? [...request.comments, { author: "کاربر فعلی", role: userRole, comment, timestamp: new Date().toLocaleString('fa-IR') }]
        : request.comments,
      history: [
        ...request.history,
        { action: `وضعیت به "${String(statusLabel)}" تغییر یافت`, author: "کاربر فعلی", timestamp: new Date().toLocaleString('fa-IR') }
      ]
    };

    try {
      await post(`/requests/${request.id}`, updatedRequest, 'PUT');
      await fetchData();
      toast({ title: "وضعیت به‌روزرسانی شد" });
    } catch {
      toast({ title: "خطا", description: "بروزرسانی وضعیت با مشکل مواجه شد", variant: "destructive" });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('آیا از حذف این درخواست اطمینان دارید؟')) return;
    try {
      await del(`/requests/${requestId}`);
      await fetchData();
      toast({ title: "درخواست حذف شد" });
    } catch {
      toast({ title: "خطا", description: "حذف درخواست با مشکل مواجه شد", variant: "destructive" });
    }
  };

  /* ❌ exportRequests و دکمه‌ی مربوطه حذف شدند */

  /* ------------------ Reusable List Renderer ------------------ */
  const RequestCard = ({ request }: { request: Request }) => (
    <Card key={request.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-lg">{request.requestType}</h3>
              {getStatusBadge(request.status)}
              {getPriorityBadge(request.priority)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">شماره درخواست:</span>
                <p>{convertNumbersToPersian(request.id)}</p>
              </div>
              <div>
                <span className="font-medium">کارمند:</span>
                <p>{request.employeeName}</p>
              </div>
              <div>
                <span className="font-medium">تاریخ ثبت:</span>
                <p>{convertNumbersToPersian(convertToJalali(request.submissionDate))}</p>
              </div>
              <div>
                <span className="font-medium">مدت:</span>
                <p>
                  {request.startDate && request.endDate
                    ? `${convertNumbersToPersian(convertToJalali(request.startDate))} - ${convertNumbersToPersian(convertToJalali(request.endDate))}`
                    : 'نامشخص'}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
          </div>

          <div className="flex gap-2 mr-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>جزئیات درخواست {request.id}</DialogTitle>
                </DialogHeader>
                {selectedRequest && (
                  <RequestDetails
                    request={selectedRequest}
                    onUpdateStatus={handleUpdateRequestStatus}
                    userRole={userRole}
                  />
                )}
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteRequest(request.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RequestsList = ({ list }: { list: Request[] }) => (
    <Fragment>
      {list.map(req => <RequestCard key={req.id} request={req} />)}
      {list.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">هیچ درخواستی یافت نشد</p>
          </CardContent>
        </Card>
      )}
    </Fragment>
  );

  /* ------------------ UI ------------------ */
  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مدیریت درخواست‌های کارمندان</h1>
          <p className="text-muted-foreground">مدیریت و پیگیری درخواست‌های کارمندان</p>
        </div>
        <div className="flex gap-2">
          <a
            href="http://192.168.11.115:3001/api/requests/export.xlsx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4 ml-2" />
              خروجی اکسل
            </Button>
          </a>

          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) { setIsEditMode(false); setSelectedRequest(null); }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />درخواست جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? `ویرایش درخواست ${selectedRequest?.id}` : "ثبت درخواست جدید"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode ? "اطلاعات درخواست را ویرایش کنید" : "فرم زیر را برای ثبت درخواست جدید تکمیل کنید"}
                </DialogDescription>
              </DialogHeader>
              <RequestForm
                employees={employees}
                onSubmit={handleCreateRequest}
                onCancel={() => setIsFormOpen(false)}
                initialData={isEditMode ? selectedRequest : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">                            
          <TabsTrigger value="completed">تکمیل شده</TabsTrigger>
		  <TabsTrigger value="pending">در انتظار</TabsTrigger>
		  <TabsTrigger value="all-requests">همه درخواست‌ها</TabsTrigger>
		  <TabsTrigger value="dashboard">داشبورد</TabsTrigger>
        </TabsList>

        {/* ALL */}
        <TabsContent value="all-requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader><CardTitle>جستجو و فیلتر</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در درخواست‌ها..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="وضعیت" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="under-review">در حال بررسی</SelectItem>
                    <SelectItem value="approved-manager">تایید مدیر</SelectItem>
                    <SelectItem value="rejected-manager">رد مدیر</SelectItem>
                    <SelectItem value="approved-ceo">تایید نهایی</SelectItem>
                    <SelectItem value="rejected-ceo">رد نهایی</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="نوع درخواست" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="مرخصی زایمان">مرخصی زایمان</SelectItem>
                    <SelectItem value="مرخصی استعلاجی">مرخصی استعلاجی</SelectItem>
                    <SelectItem value="مرخصی استحقاقی">مرخصی استحقاقی</SelectItem>
                    <SelectItem value="مساعده مالی">مساعده مالی</SelectItem>
                    <SelectItem value="درخواست اداری">درخواست اداری</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); }}
                >
                  <Filter className="h-4 w-4 ml-2" />
                  پاک کردن فیلترها
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <div className="grid gap-4">
            <RequestsList list={filteredRequests} />
          </div>
        </TabsContent>

        {/* DASHBOARD */}
        <TabsContent value="dashboard">
          <RequestDashboard requests={requests} userRole={userRole} />
        </TabsContent>

        {/* PENDING */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>درخواست‌های در انتظار / در حال بررسی</CardTitle>
              <CardDescription>لیست درخواست‌هایی که هنوز نهایی نشده‌اند</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4">
            <RequestsList list={pendingRequests} />
          </div>
        </TabsContent>

        {/* COMPLETED */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>درخواست‌های تکمیل شده</CardTitle>
              <CardDescription>درخواست‌های تایید یا رد شده</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4">
            <RequestsList list={completedRequests} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Requests;
