import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Eye, Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskDetails } from "@/components/tasks/TaskDetails";
import { get, post, del } from '@/lib/http';
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
  department: string;
  attachments: File[];
  completedDate?: string;
}

const departments = [
  "فروش",
  "حقوقی",
  "فناوری اطلاعات",
  "منابع انسانی",
  "مالی"
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchTasks = async () => {
    try {
      const data = await get('/tasks');
      setTasks(data);
    } catch (error) {
      toast({
        title: "خطا",
        description: "دریافت لیست وظایف با مشکل مواجه شد",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await get('/employees');
      setEmployees(data);
    } catch (error) {
      toast({
        title: "خطا",
        description: "دریافت لیست کارمندان با مشکل مواجه شد",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsTaskFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesDepartment = departmentFilter === "all" || task.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, departmentFilter]);

  const handleCreateTask = async (taskData: any) => {
    try {
      const newTask = {
        ...taskData,
        id: `TASK${Date.now()}`,
      };
      await post('/tasks', newTask);
      await fetchTasks();
      setIsTaskFormOpen(false);
      toast({
        title: "وظیفه ایجاد شد",
        description: "وظیفه جدید با موفقیت ایجاد شد.",
      });
    } catch (error) {
      toast({ title: "خطا", description: "ایجاد وظیفه با مشکل مواجه شد.", variant: "destructive" });
    }
  };

  const handleEditTask = async (taskData: any) => {
    if (!editingTask) return;
    try {
      await post(`/tasks/${editingTask.id}`, taskData, 'PUT');
      await fetchTasks();
      setEditingTask(null);
      setIsTaskFormOpen(false);
      toast({
        title: "وظیفه بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد.",
      });
    } catch (error) {
      toast({ title: "خطا", description: "بروزرسانی وظیفه با مشکل مواجه شد.", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("آیا از حذف این وظیفه اطمینان دارید؟")) {
      try {
        await del(`/tasks/${taskId}`);
        await fetchTasks();
        toast({
          title: "وظیفه حذف شد",
          description: "وظیفه با موفقیت حذف شد.",
        });
      } catch (error) {
        toast({ title: "خطا", description: "حذف وظیفه با مشکل مواجه شد.", variant: "destructive" });
      }
    }
  };

  const openTaskForm = (task?: Task) => {
    setEditingTask(task || null);
    setIsTaskFormOpen(true);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مدیریت وظایف</h1>
          <p className="text-muted-foreground mt-1">مدیریت و نظارت بر وظایف کارمندان</p>
        </div>
        <Button onClick={() => openTaskForm()} className="w-full sm:w-auto">
          <Plus className="ml-2 h-4 w-4" />
          ایجاد وظیفه جدید
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{taskStats.total}</div>
              <div className="text-sm text-muted-foreground">کل وظایف</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
              <div className="text-sm text-muted-foreground">در انتظار</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-sm text-muted-foreground">در حال انجام</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-muted-foreground">تکمیل شده</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در وظایف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="in-progress">در حال انجام</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                <SelectItem value="low">کم</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="بخش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه بخش‌ها</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setDepartmentFilter("all");
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست وظایف ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شناسه وظیفه</TableHead>
                  <TableHead>نام کارمند</TableHead>
                  <TableHead>شرح وظیفه</TableHead>
                  <TableHead>بخش</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead>تاریخ تحویل</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.id}</TableCell>
                    <TableCell>{task.employeeName}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                    <TableCell>{task.department}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(task.status).variant}>
                        {getStatusBadge(task.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadge(task.priority).variant}>
                        {getPriorityBadge(task.priority).label}
                      </Badge>
                    </TableCell>
                    <TableCell>{convertNumbersToPersian(convertToJalali(task.dueDate))}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTaskDetails(task)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTaskForm(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              هیچ وظیفه‌ای یافت نشد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "ویرایش وظیفه" : "ایجاد وظیفه جدید"}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            employees={employees}
            departments={departments}
            onSubmit={editingTask ? handleEditTask : handleCreateTask}
            onCancel={() => setIsTaskFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>جزئیات وظیفه</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskDetails
              task={selectedTask}
              onClose={() => setIsTaskDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
