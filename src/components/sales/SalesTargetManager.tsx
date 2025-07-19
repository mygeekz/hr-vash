import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit2, Plus, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface SalesTargetManagerProps {
  userRole: string;
}

export const SalesTargetManager = ({ userRole }: SalesTargetManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data - in real app this would come from API
  const salesTargets = [
    {
      id: 1,
      employeeName: 'احمد محمدی',
      employeeId: 'EMP001',
      department: 'فروش',
      monthlyTarget: 50000000,
      currentSales: 32000000,
      percentage: 64,
      lastUpdated: '1404/10/01',
      status: 'active'
    },
    {
      id: 2,
      employeeName: 'فاطمه احمدی',
      employeeId: 'EMP002',
      department: 'فروش',
      monthlyTarget: 45000000,
      currentSales: 29000000,
      percentage: 64.4,
      lastUpdated: '1404/10/01',
      status: 'active'
    },
    {
      id: 3,
      employeeName: 'علی رضایی',
      employeeId: 'EMP003',
      department: 'فروش',
      monthlyTarget: 55000000,
      currentSales: 28500000,
      percentage: 51.8,
      lastUpdated: '1404/10/01',
      status: 'active'
    }
  ];

  const [targets, setTargets] = useState(salesTargets);
  const [formData, setFormData] = useState({
    employeeId: '',
    monthlyTarget: '',
    period: 'month'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTarget) {
      // Update existing target
      setTargets(prev => prev.map(target => 
        target.id === editingTarget.id 
          ? { ...target, monthlyTarget: parseInt(formData.monthlyTarget) }
          : target
      ));
      toast.success('هدف فروش با موفقیت بروزرسانی شد');
    } else {
      // Add new target
      const newTarget = {
        id: targets.length + 1,
        employeeName: 'کارمند جدید',
        employeeId: formData.employeeId,
        department: 'فروش',
        monthlyTarget: parseInt(formData.monthlyTarget),
        currentSales: 0,
        percentage: 0,
        lastUpdated: '1404/10/05',
        status: 'active'
      };
      setTargets(prev => [...prev, newTarget]);
      toast.success('هدف فروش جدید با موفقیت ایجاد شد');
    }

    setFormData({ employeeId: '', monthlyTarget: '', period: 'month' });
    setEditingTarget(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (target: any) => {
    setEditingTarget(target);
    setFormData({
      employeeId: target.employeeId,
      monthlyTarget: target.monthlyTarget.toString(),
      period: 'month'
    });
    setIsDialogOpen(true);
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 100) {
      return { color: 'bg-green-100 text-green-800', icon: TrendingUp, text: 'هدف محقق شده' };
    } else if (percentage >= 80) {
      return { color: 'bg-yellow-100 text-yellow-800', icon: Target, text: 'در حال پیگیری' };
    } else {
      return { color: 'bg-red-100 text-red-800', icon: TrendingDown, text: 'نیاز به بررسی' };
    }
  };

  const overallStats = {
    totalTargets: targets.reduce((sum, t) => sum + t.monthlyTarget, 0),
    totalAchieved: targets.reduce((sum, t) => sum + t.currentSales, 0),
    avgPerformance: targets.reduce((sum, t) => sum + t.percentage, 0) / targets.length,
    achievedCount: targets.filter(t => t.percentage >= 100).length
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل هدف ماهانه</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalTargets)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل محقق شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalAchieved)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین عملکرد</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgPerformance.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اهداف محقق شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.achievedCount}</div>
            <p className="text-xs text-muted-foreground">
              از {targets.length} هدف
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="انتخاب دوره" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">ماهانه</SelectItem>
              <SelectItem value="quarter">فصلی</SelectItem>
              <SelectItem value="year">سالانه</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(userRole === 'admin' || userRole === 'manager') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                تعیین هدف جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTarget ? 'ویرایش هدف فروش' : 'تعیین هدف فروش جدید'}
                </DialogTitle>
                <DialogDescription>
                  هدف فروش برای کارمند مورد نظر را تعیین کنید
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employeeId">کد کارمند</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="مثال: EMP001"
                    disabled={!!editingTarget}
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyTarget">هدف ماهانه (تومان)</Label>
                  <Input
                    id="monthlyTarget"
                    type="number"
                    value={formData.monthlyTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyTarget: e.target.value }))}
                    placeholder="مثال: 50000000"
                  />
                </div>

                <div>
                  <Label htmlFor="period">دوره</Label>
                  <Select value={formData.period} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, period: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">ماهانه</SelectItem>
                      <SelectItem value="quarter">فصلی</SelectItem>
                      <SelectItem value="year">سالانه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    {editingTarget ? 'بروزرسانی' : 'ایجاد هدف'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Targets Table */}
      <Card>
        <CardHeader>
          <CardTitle>اهداف فروش کارمندان</CardTitle>
          <CardDescription>
            مدیریت و نظارت بر اهداف فروش کارمندان
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کارمند</TableHead>
                <TableHead>کد کارمند</TableHead>
                <TableHead>هدف ماهانه</TableHead>
                <TableHead>محقق شده</TableHead>
                <TableHead>درصد پیشرفت</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>آخرین بروزرسانی</TableHead>
                {(userRole === 'admin' || userRole === 'manager') && (
                  <TableHead>عملیات</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => {
                const status = getPerformanceStatus(target.percentage);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={target.id}>
                    <TableCell className="font-medium">{target.employeeName}</TableCell>
                    <TableCell>{target.employeeId}</TableCell>
                    <TableCell>{formatCurrency(target.monthlyTarget)}</TableCell>
                    <TableCell>{formatCurrency(target.currentSales)}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{target.percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={target.percentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell>{target.lastUpdated}</TableCell>
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(target)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          ویرایش
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};