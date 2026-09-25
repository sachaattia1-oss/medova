import { Navigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TutorDiscussions from "@/pages/tutor/TutorDiscussions";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const AdminQuestions = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <TutorDiscussions />
        </div>
      </main>
    </div>
  );
};

export default AdminQuestions;