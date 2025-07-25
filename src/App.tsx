import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/ui/layout/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import Tasks from "./pages/Tasks";
import Requests from "./pages/Requests";
import Sales from "./pages/Sales";
import Salary from "./pages/Salary";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Branches from "./pages/Branches";
import UserManagement from "./pages/Settings/UserManagement";
import { ProtectedRoute } from "./components/ui/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/employees" element={<DashboardLayout><Employees /></DashboardLayout>} />
              <Route path="/employees/add" element={<DashboardLayout><AddEmployee /></DashboardLayout>} />
              <Route path="/employees/edit/:id" element={<DashboardLayout><EditEmployee /></DashboardLayout>} />
              <Route path="/tasks" element={<DashboardLayout><Tasks /></DashboardLayout>} />
              <Route path="/requests" element={<DashboardLayout><Requests /></DashboardLayout>} />
              <Route path="/sales" element={<DashboardLayout><Sales /></DashboardLayout>} />
              <Route path="/salary" element={<DashboardLayout><Salary /></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
              <Route path="/branches" element={<DashboardLayout><Branches /></DashboardLayout>} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/settings/users" element={<DashboardLayout><UserManagement /></DashboardLayout>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;