import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardCourses from "./pages/DashboardCourses";
import DashboardQCM from "./pages/DashboardQCM";
import TakeQuiz from "./pages/TakeQuiz";
import TakeSeries from "./pages/TakeSeries";
import CategoryCourses from "./pages/CategoryCourses";
import DashboardProgress from "./pages/DashboardProgress";
import DashboardSchedule from "./pages/DashboardSchedule";
import CourseDetail from "./pages/CourseDetail";
import AdminCourses from "./pages/AdminCourses";
import AdminTutors from "./pages/AdminTutors";
import AdminPayments from "./pages/AdminPayments";
import TutorDashboard from "./pages/TutorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/cours" element={<DashboardCourses />} />
            <Route path="/dashboard/cours/categorie/:categoryId" element={<CategoryCourses />} />
            <Route path="/dashboard/cours/:id" element={<CourseDetail />} />
            <Route path="/dashboard/qcm" element={<DashboardQCM />} />
            <Route path="/dashboard/qcm/:quizId" element={<TakeQuiz />} />
            <Route path="/dashboard/qcm/series/:courseId" element={<TakeSeries />} />
            <Route path="/dashboard/progression" element={<DashboardProgress />} />
            <Route path="/dashboard/emploi-du-temps" element={<DashboardSchedule />} />
            <Route path="/admin/cours" element={<AdminCourses />} />
            <Route path="/admin/tuteurs" element={<AdminTutors />} />
            <Route path="/admin/paiements" element={<AdminPayments />} />
            <Route path="/tutor" element={<TutorDashboard />} />
            <Route path="/tutor/*" element={<TutorDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
