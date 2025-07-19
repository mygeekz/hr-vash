import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

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
  attachments: string[];
  comments: Array<{
    author: string;
    role: string;
    comment: string;
    timestamp: string;
  }>;
  history: Array<{
    action: string;
    author: string;
    timestamp: string;
  }>;
}

interface RequestDashboardProps {
  requests: Request[];
  userRole: 'employee' | 'admin' | 'manager' | 'ceo';
}

export const RequestDashboard: React.FC<RequestDashboardProps> = ({ requests, userRole }) => {
  // Calculate statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'under-review').length;
  const approvedRequests = requests.filter(r => r.status.includes('approved')).length;
  const rejectedRequests = requests.filter(r => r.status.includes('rejected')).length;
  
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
  
  // Request types distribution
  const requestTypeData = requests.reduce((acc, request) => {
    const type = request.requestType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(requestTypeData).map(([name, value]) => ({
    name,
    value,
    count: value
  }));

  // Status distribution for pie chart
  const statusData = [
    { name: 'در انتظار', value: pendingRequests, color: '#f59e0b' },
    { name: 'تایید شده', value: approvedRequests, color: '#10b981' },
    { name: 'رد شده', value: rejectedRequests, color: '#ef4444' }
  ];

  // Priority distribution
  const highPriorityRequests = requests.filter(r => r.priority === 'high').length;
  const mediumPriorityRequests = requests.filter(r => r.priority === 'medium').length;
  const lowPriorityRequests = requests.filter(r => r.priority === 'low').length;

  // Recent requests for quick view
  const recentRequests = requests
    .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درخواست‌ها</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              مجموع درخواست‌های ثبت شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">در انتظار بررسی</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              درخواست‌های در انتظار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تایید شده</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests}</div>
            <p className="text-xs text-muted-foreground">
              درخواست‌های تایید شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رد شده</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRequests}</div>
            <p className="text-xs text-muted-foreground">
              درخواست‌های رد شده
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>انواع درخواست‌ها</CardTitle>
            <CardDescription>توزیع درخواست‌ها بر اساس نوع</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>وضعیت درخواست‌ها</CardTitle>
            <CardDescription>توزیع وضعیت‌های مختلف</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>اولویت درخواست‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">بالا</span>
              </div>
              <span className="text-sm font-medium">{highPriorityRequests}</span>
            </div>
            <Progress value={(highPriorityRequests / totalRequests) * 100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">متوسط</span>
              </div>
              <span className="text-sm font-medium">{mediumPriorityRequests}</span>
            </div>
            <Progress value={(mediumPriorityRequests / totalRequests) * 100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm">کم</span>
              </div>
              <span className="text-sm font-medium">{lowPriorityRequests}</span>
            </div>
            <Progress value={(lowPriorityRequests / totalRequests) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>معیارهای عملکرد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نرخ تایید</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">{approvalRate}%</span>
                {approvalRate >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <Progress value={approvalRate} className="h-2" />
            
            <div className="text-xs text-muted-foreground">
              {approvedRequests} از {totalRequests} درخواست تایید شده
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>آخرین درخواست‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{request.requestType}</p>
                  <p className="text-xs text-muted-foreground">{request.employeeName}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {request.status === 'pending' ? 'در انتظار' :
                   request.status === 'under-review' ? 'در حال بررسی' :
                   request.status.includes('approved') ? 'تایید' : 'رد'}
                </Badge>
              </div>
            ))}
            
            {recentRequests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                هیچ درخواستی یافت نشد
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Actions */}
      {userRole !== 'employee' && (
        <Card>
          <CardHeader>
            <CardTitle>اقدامات مدیریتی</CardTitle>
            <CardDescription>کارهای مورد نیاز برای {userRole}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userRole === 'admin' && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">درخواست‌های جدید</span>
                  </div>
                  <p className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">نیاز به ارسال به مدیر</p>
                </div>
              )}
              
              {(userRole === 'manager' || userRole === 'ceo') && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">منتظر تایید</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => 
                      (userRole === 'manager' && r.status === 'under-review') ||
                      (userRole === 'ceo' && !r.status.includes('ceo'))
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">درخواست‌های منتظر تصمیم</p>
                </div>
              )}
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">تکمیل شده امروز</span>
                </div>
                <p className="text-2xl font-bold">
                  {requests.filter(r => 
                    (r.status.includes('approved') || r.status.includes('rejected')) &&
                    new Date(r.submissionDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">درخواست‌های تکمیل شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};