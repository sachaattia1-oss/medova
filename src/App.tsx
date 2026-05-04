import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import SubscribedRoute from "@/components/SubscribedRoute";
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
import DashboardReminders from "./pages/DashboardReminders";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardMyQuestions from "./pages/DashboardMyQuestions";

import CourseDetail from "./pages/CourseDetail";
import AdminCourses from "./pages/AdminCourses";
import AdminQCM from "./pages/AdminQCM";
import AdminTutors from "./pages/AdminTutors";
import AdminPayments from "./pages/AdminPayments";
import AdminDashboard from "./pages/AdminDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import MentionsLegales from "./pages/MentionsLegales";
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
            <Route path="/subscribed" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/cours" element={<SubscribedRoute><DashboardCourses /></SubscribedRoute>} />
            <Route path="/dashboard/cours/categorie/:categoryId" element={<SubscribedRoute><CategoryCourses /></SubscribedRoute>} />
            <Route path="/dashboard/cours/:id" element={<SubscribedRoute><CourseDetail /></SubscribedRoute>} />
            <Route path="/dashboard/qcm" element={<SubscribedRoute><DashboardQCM /></SubscribedRoute>} />
            <Route path="/dashboard/qcm/:quizId" element={<SubscribedRoute><TakeQuiz /></SubscribedRoute>} />
            <Route path="/dashboard/qcm/series/:courseId" element={<SubscribedRoute><TakeSeries /></SubscribedRoute>} />
            <Route path="/dashboard/progression" element={<SubscribedRoute><DashboardProgress /></SubscribedRoute>} />
            <Route path="/dashboard/emploi-du-temps" element={<SubscribedRoute><DashboardSchedule /></SubscribedRoute>} />
            <Route path="/dashboard/rappels" element={<SubscribedRoute><DashboardReminders /></SubscribedRoute>} />
            <Route path="/dashboard/parametres" element={<DashboardSettings />} />
            <Route path="/dashboard/mes-questions" element={<SubscribedRoute><DashboardMyQuestions /></SubscribedRoute>} />
            
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/cours" element={<AdminCourses />} />
            <Route path="/admin/qcm" element={<AdminQCM />} />
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
