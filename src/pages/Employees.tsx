// src/pages/Employees.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { get, del } from '@/lib/http'; // <<< ایمپورت توابع جدید

// Define the Employee type
interface Employee {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  contactNumber: string;
  email: string;
  status: 'active' | 'inactive';
  dateJoined: string;
  photo: string | null;
}

export default function Employees() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // تابع برای دریافت اطلاعات کارمندان از سرور
  const fetchEmployees = async () => {
    try {
      const data = await get('/employees');
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast({
        title: "خطا",
        description: "دریافت اطلاعات کارکنان با مشکل مواجه شد",
        variant: "destructive",
      });
    }
  };

  // دریافت اطلاعات هنگام بارگذاری کامپوننت
  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (employeeId: string) => {
    if (confirm("آیا از حذف این کارمند اطمینان دارید؟")) {
      try {
        await del(`/employees/${employeeId}`); // <<< استفاده از تابع del
        toast({
          title: "موفقیت",
          description: "کارمند با موفقیت حذف شد",
        });
        fetchEmployees(); // دریافت مجدد لیست کارمندان
      } catch (error) {
        toast({
          title: "خطا",
          description: "حذف کارمند با مشکل مواجه شد",
          variant: "destructive",
        });
      }
    }
  };

  // فیلتر کردن کارمندان
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // منطق صفحه‌بندی
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (employeeId: string) => {
    navigate(`/employees/edit/${employeeId}`);
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge
        variant={status === 'active' ? 'default' : 'secondary'}
        className={cn(
          status === 'active'
            ? 'bg-success text-success-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {status === 'active' ? 'فعال' : 'غیرفعال'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مدیریت کارکنان</h1>
          <p className="text-muted-foreground">
            مدیریت اطلاعات کارکنان و پرسنل شرکت
          </p>
        </div>
        <Button
          onClick={() => navigate('/employees/add')}
          className="bg-gradient-primary hover:opacity-90 shadow-medium"
        >
          <Plus className="w-4 h-4 ml-2" />
          افزودن کارمند جدید
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل کارکنان</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کارکنان فعال</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کارکنان غیرفعال</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'inactive').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>فیلتر و جستجو</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="جستجو بر اساس نام، کد کارمندی یا سمت..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  وضعیت: {statusFilter === 'all' ? 'همه' : statusFilter === 'active' ? 'فعال' : 'غیرفعال'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>همه</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>فعال</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>غیرفعال</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-right">کد کارمندی</TableHead>
                  <TableHead className="text-right">نام و نام خانوادگی</TableHead>
                  <TableHead className="text-right">سمت</TableHead>
                  <TableHead className="text-right">بخش</TableHead>
                  <TableHead className="text-right">شماره تماس</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{employee.fullName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.jobTitle}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell className="font-mono">{employee.contactNumber}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          <DropdownMenuItem onClick={() => handleEdit(employee.id)} className="gap-2"><Edit className="w-4 h-4" />ویرایش</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(employee.id)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" />حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                نمایش {startIndex + 1} تا {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} از {filteredEmployees.length} کارمند
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>قبلی</Button>
                <span className="text-sm font-medium px-3">صفحه {currentPage} از {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>بعدی</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">کارمندی یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'هیچ کارمندی با این معیارهای جستجو یافت نشد' : 'هنوز کارمندی اضافه نشده است'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/employees/add')} className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 ml-2" />افزودن اولین کارمند
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}