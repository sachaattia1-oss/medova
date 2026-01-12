import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Clock, Award, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
  completed_at: string | null;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  category: string | null;
}

const DashboardProgress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user's quiz attempts
        const { data: attemptsData } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (attemptsData) {
          setAttempts(attemptsData);

          // Fetch quiz details
          const quizIds = [...new Set(attemptsData.map(a => a.quiz_id))];
          if (quizIds.length > 0) {
            const { data: quizzesData } = await supabase
              .from("quizzes")
              .select("id, title, category")
              .in("id", quizIds);

            if (quizzesData) {
              const quizMap = quizzesData.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
              }, {} as Record<string, Quiz>);
              setQuizzes(quizMap);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate stats
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter(a => a.completed_at).length;
  const averageScore = attempts.length > 0
    ? Math.round(
        attempts.reduce((acc, a) => {
          if (a.score !== null && a.total_questions !== null && a.total_questions > 0) {
            return acc + (a.score / a.total_questions) * 100;
          }
          return acc;
        }, 0) / attempts.length
      )
    : 0;
  const totalTimeSeconds = attempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);
  const totalHours = Math.floor(totalTimeSeconds / 3600);
  const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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
          title="Ma progression" 
          description="Suis ton évolution et améliore tes performances"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="QCM tentés"
            value={totalAttempts}
            icon={Target}
          />
          <StatsCard
            title="QCM complétés"
            value={completedAttempts}
            icon={Award}
          />
          <StatsCard
            title="Score moyen"
            value={`${averageScore}%`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Temps total"
            value={`${totalHours}h ${totalMinutes}m`}
            icon={Clock}
          />
        </div>

        {/* Progress Overview */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
          <h3 className="font-semibold mb-4">Objectif de la semaine</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">QCM complétés</span>
                <span className="font-medium">{completedAttempts}/10</span>
              </div>
              <Progress value={Math.min((completedAttempts / 10) * 100, 100)} className="h-3" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Score cible (80%)</span>
                <span className="font-medium">{averageScore}%</span>
              </div>
              <Progress value={Math.min((averageScore / 80) * 100, 100)} className="h-3" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Historique des QCM</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-card rounded-xl border border-border/50 animate-pulse" />
              ))}
            </div>
          ) : attempts.length > 0 ? (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const quiz = quizzes[attempt.quiz_id];
                const scorePercent = attempt.score !== null && attempt.total_questions !== null && attempt.total_questions > 0
                  ? Math.round((attempt.score / attempt.total_questions) * 100)
                  : 0;
                const isPassed = scorePercent >= 50;

                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-card-hover transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isPassed ? "bg-green-500/10" : "bg-red-500/10"
                      }`}>
                        {isPassed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{quiz?.title || "QCM"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(attempt.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">{attempt.score}/{attempt.total_questions}</p>
                        <p className="text-sm text-muted-foreground">{scorePercent}%</p>
                      </div>
                      {attempt.time_spent_seconds && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Durée</p>
                          <p className="font-medium">{formatTime(attempt.time_spent_seconds)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Aucun QCM complété</h3>
              <p className="text-sm text-muted-foreground">
                Commence un QCM pour suivre ta progression.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardProgress;
