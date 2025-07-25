import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Receipt,
  Calendar,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/number-to-persian';

// Mock salary data
const mockSalaryRecords = [
  {
    id: 'SAL001',
    employeeId: 'EMP001',
    employeeName: 'علی احمدی',
    department: 'فروش',
    baseSalary: 15000000,
    bonuses: 2000000,
    overtime: 500000,
    deductions: 300000,
    tax: 1200000,
    insurance: 450000,
    finalSalary: 15550000,
    paymentDate: '2024-01-30',
    paymentStatus: 'paid',
    currency: 'IRR',
    notes: 'پاداش فروش ماهانه'
  },
  {
    id: 'SAL002',
    employeeId: 'EMP002',
    employeeName: 'فاطمه رضایی',
    department: 'مالی',
    baseSalary: 12000000,
    bonuses: 800000,
    overtime: 200000,
    deductions: 200000,
    tax: 960000,
    insurance: 360000,
    finalSalary: 11480000,
    paymentDate: '2024-01-30',
    paymentStatus: 'paid',
    currency: 'IRR',
    notes: 'عملکرد عالی'
  },
  {
    id: 'SAL003',
    employeeId: 'EMP003',
    employeeName: 'محمد کریمی',
    department: 'فنی',
    baseSalary: 18000000,
    bonuses: 1500000,
    overtime: 800000,
    deductions: 400000,
    tax: 1440000,
    insurance: 540000,
    finalSalary: 17920000,
    paymentDate: '2024-02-01',
    paymentStatus: 'processing',
    currency: 'IRR',
    notes: 'اضافه کاری پروژه'
  },
  {
    id: 'SAL004',
    employeeId: 'EMP004',
    employeeName: 'زهرا محمدی',
    department: 'منابع انسانی',
    baseSalary: 14000000,
    bonuses: 1000000,
    overtime: 300000,
    deductions: 250000,
    tax: 1120000,
    insurance: 420000,
    finalSalary: 13510000,
    paymentDate: '2024-02-01',
    paymentStatus: 'pending',
    currency: 'IRR',
    notes: ''
  },
];

export default function SalaryReports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter records
  const filteredRecords = mockSalaryRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.paymentStatus === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'پرداخت شده', variant: 'default' as const, className: 'bg-success text-success-foreground' },
      processing: { label: 'در حال پردازش', variant: 'secondary' as const, className: 'bg-warning text-warning-foreground' },
      pending: { label: 'در انتظار', variant: 'outline' as const, className: 'bg-destructive/10 text-destructive border-destructive' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={cn(config.className)}>
        {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (recordId: string) => {
    console.log('View details for:', recordId);
  };

  const handleDownloadReceipt = (recordId: string) => {
    console.log('Download receipt for:', recordId);
  };

  const handleExportData = () => {
    console.log('Export salary data');
  };

  // Calculate statistics
  const totalPaid = filteredRecords
    .filter(record => record.paymentStatus === 'paid')
    .reduce((sum, record) => sum + record.finalSalary, 0);

  const departments = [...new Set(mockSalaryRecords.map(record => record.department))];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل پرداختی‌ها</p>
                <p className="text-xl font-bold">{formatNumber(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">پرداخت شده</p>
                <p className="text-xl font-bold">
                  {filteredRecords.filter(r => r.paymentStatus === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">در انتظار</p>
                <p className="text-xl font-bold">
                  {filteredRecords.filter(r => r.paymentStatus === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل کارمندان</p>
                <p className="text-xl font-bold">{mockSalaryRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>گزارشات حقوق و دستمزد</CardTitle>
            <Button onClick={handleExportData} className="gap-2">
              <Download className="w-4 h-4" />
              خروجی Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="جستجو بر اساس نام، کد کارمندی یا بخش..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="وضعیت پرداخت" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="paid">پرداخت شده</SelectItem>
                  <SelectItem value="processing">در حال پردازش</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="بخش" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">همه بخش‌ها</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Records Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-right">کد</TableHead>
                  <TableHead className="text-right">کارمند</TableHead>
                  <TableHead className="text-right">بخش</TableHead>
                  <TableHead className="text-right">حقوق پایه</TableHead>
                  <TableHead className="text-right">پاداش</TableHead>
                  <TableHead className="text-right">کسورات</TableHead>
                  <TableHead className="text-right">حقوق نهایی</TableHead>
                  <TableHead className="text-right">تاریخ پرداخت</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-medium">{record.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{record.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="font-mono">
                      {formatNumber(record.baseSalary)}
                    </TableCell>
                    <TableCell className="font-mono text-success">
                      +{formatNumber(record.bonuses + record.overtime)}
                    </TableCell>
                    <TableCell className="font-mono text-destructive">
                      -{formatNumber(record.deductions + record.tax + record.insurance)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-lg">
                      {formatNumber(record.finalSalary)}
                    </TableCell>
                    <TableCell>{record.paymentDate}</TableCell>
                    <TableCell>{getStatusBadge(record.paymentStatus)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          <DropdownMenuItem 
                            onClick={() => handleViewDetails(record.id)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            جزئیات
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadReceipt(record.id)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            دانلود فیش حقوقی
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                نمایش {startIndex + 1} تا {Math.min(startIndex + itemsPerPage, filteredRecords.length)} از {filteredRecords.length} رکورد
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  قبلی
                </Button>
                
                <span className="text-sm font-medium px-3">
                  صفحه {currentPage} از {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredRecords.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">رکوردی یافت نشد</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'هیچ رکورد حقوقی با این معیارهای جستجو یافت نشد' : 'هنوز حقوقی پردازش نشده است'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}