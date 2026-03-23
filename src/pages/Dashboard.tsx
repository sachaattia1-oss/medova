import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import CourseCard from "@/components/dashboard/CourseCard";
import { BookOpen, GraduationCap, Target, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_free: boolean | null;
  thumbnail_url: string | null;
}

interface QuizAttempt {
  id: string;
  score: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isApprovedTutor, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect tutors to their dashboard
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      if (isApprovedTutor && !isAdmin) {
        navigate("/tutor");
      }
    }
  }, [user, authLoading, roleLoading, isApprovedTutor, isAdmin, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .order("order_index", { ascending: true })
          .limit(6);

        if (coursesData) setCourses(coursesData);

        // Fetch user's quiz attempts
        const { data: attemptsData } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (attemptsData) setQuizAttempts(attemptsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate stats
  const totalQuizzes = quizAttempts.length;
  const averageScore = quizAttempts.length > 0
    ? Math.round(
        quizAttempts.reduce((acc, a) => {
          if (a.score !== null && a.total_questions !== null && a.total_questions > 0) {
            return acc + (a.score / a.total_questions) * 100;
          }
          return acc;
        }, 0) / quizAttempts.length
      )
    : 0;
  const totalTime = quizAttempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);
  const totalHours = Math.floor(totalTime / 3600);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="ml-64 p-8">
        <DashboardHeader 
          title="Tableau de bord" 
          description="Bienvenue ! Voici un aperçu de ta progression."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Cours disponibles"
            value={courses.length}
            icon={BookOpen}
            onClick={() => navigate("/dashboard/cours")}
          />
          <StatsCard
            title="QCM complétés"
            value={totalQuizzes}
            icon={GraduationCap}
            trend={totalQuizzes > 0 ? { value: 12, isPositive: true } : undefined}
            onClick={() => navigate("/dashboard/qcm")}
          />
          <StatsCard
            title="Score moyen"
            value={`${averageScore}%`}
            icon={Target}
          />
          <StatsCard
            title="Temps d'étude"
            value={`${totalHours}h`}
            description="Total cumulé"
            icon={Clock}
          />
        </div>

        {/* Recent Courses */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Cours récents</h2>
            <button 
              onClick={() => navigate("/dashboard/cours")}
              className="text-sm text-accent hover:underline"
            >
              Voir tous les cours →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-card border border-border/50">
                  <Skeleton className="aspect-video rounded-xl mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 3).map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  description={course.description || undefined}
                  category={course.category || undefined}
                  isFree={course.is_free || false}
                  thumbnailUrl={course.thumbnail_url || undefined}
                  onClick={() => navigate(`/dashboard/cours/${course.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Aucun cours disponible</h3>
              <p className="text-sm text-muted-foreground">
                Les cours seront bientôt disponibles.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
