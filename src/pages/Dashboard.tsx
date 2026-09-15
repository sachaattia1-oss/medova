import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { FileText, CheckCircle2, Target, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Attempt {
  id: string;
  score: number | null;
  total_questions: number | null;
  answers_data: any;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isApprovedTutor, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [totalAnnales, setTotalAnnales] = useState(0);
  const [annalesDone, setAnnalesDone] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [recentAnnaleAttempts, setRecentAnnaleAttempts] = useState<Attempt[]>([]);
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
        // Annale questions available
        const { data: annaleQuestions } = await supabase
          .from("quiz_questions")
          .select("id")
          .eq("is_annale", true);

        const annaleIds = new Set((annaleQuestions || []).map((q) => q.id));
        setTotalAnnales(annaleIds.size);

        // User attempts
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("id, score, total_questions, answers_data, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const annaleAttempts = (attempts || []).filter((a: Attempt) => {
          const data = a.answers_data;
          if (!data) return false;
          const qIds: string[] = Array.isArray(data)
            ? data.map((x: any) => x.questionId || x.question_id).filter(Boolean)
            : Object.keys(data);
          return qIds.some((id) => annaleIds.has(id));
        });

        setAnnalesDone(annaleAttempts.length);
        setRecentAnnaleAttempts(annaleAttempts.slice(0, 5));

        const scored = annaleAttempts.filter(
          (a) => a.score !== null && a.total_questions && a.total_questions > 0
        );
        if (scored.length > 0) {
          const avg =
            scored.reduce((sum, a) => sum + (a.score! / a.total_questions!) * 20, 0) /
            scored.length;
          setAvgScore(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <DashboardHeader
          title="Tableau de bord"
          description="Bienvenue ! Voici un aperçu de ta progression sur les annales."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Annales disponibles"
            value={totalAnnales}
            icon={FileText}
            paletteIndex={0}
            onClick={() => navigate("/dashboard/annales")}
          />
          <StatsCard
            title="Annales réalisées"
            value={annalesDone}
            icon={CheckCircle2}
            paletteIndex={1}
            onClick={() => navigate("/dashboard/annales")}
          />
          <StatsCard
            title="Score moyen"
            value={avgScore !== null ? `${avgScore}/20` : "—"}
            icon={Target}
            paletteIndex={2}
            onClick={() => navigate("/dashboard/progression")}
          />
        </div>

        {/* Recent annale attempts */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Dernières annales réalisées
            </CardTitle>
            <button
              onClick={() => navigate("/dashboard/annales")}
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              Faire des annales <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : recentAnnaleAttempts.length > 0 ? (
              <div className="space-y-2">
                {recentAnnaleAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {attempt.score ?? 0}/{attempt.total_questions ?? 0} bonnes réponses
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {attempt.score !== null && attempt.total_questions ? (
                      <span className="text-sm font-semibold text-accent px-3 py-1 bg-accent/10 rounded-full">
                        {Math.round((attempt.score / attempt.total_questions) * 200) / 10}/20
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Tu n'as pas encore fait d'annales. Lance-toi !
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
