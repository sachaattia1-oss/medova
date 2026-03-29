import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp, CheckCircle, XCircle, Target } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string | null;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  course_id: string | null;
}

interface Course {
  id: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const CHART_COLORS = [
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(340, 65%, 55%)",
  "hsl(45, 80%, 50%)",
  "hsl(270, 55%, 55%)",
  "hsl(180, 50%, 45%)",
  "hsl(15, 70%, 55%)",
];

const DashboardProgress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [categories, setCategories] = useState<Record<string, Category>>({});
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
        // Fetch all categories
        const { data: catData } = await supabase
          .from("course_categories")
          .select("id, name")
          .order("order_index");

        if (catData) {
          const catMap = catData.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
          }, {} as Record<string, Category>);
          setCategories(catMap);
        }

        // Fetch all courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, category_id");

        if (coursesData) {
          const courseMap = coursesData.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
          }, {} as Record<string, Course>);
          setCourses(courseMap);
        }

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
              .select("id, title, course_id")
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

  // Calculate progression by category
  const categoryStats = () => {
    const stats: Record<string, { name: string; totalScore: number; count: number }> = {};

    attempts.forEach((attempt) => {
      if (attempt.score === null || attempt.total_questions === null || attempt.total_questions === 0) return;

      const quiz = quizzes[attempt.quiz_id];
      if (!quiz?.course_id) return;

      const course = courses[quiz.course_id];
      if (!course?.category_id) return;

      const category = categories[course.category_id];
      if (!category) return;

      if (!stats[course.category_id]) {
        stats[course.category_id] = { name: category.name, totalScore: 0, count: 0 };
      }
      stats[course.category_id].totalScore += (attempt.score / attempt.total_questions) * 100;
      stats[course.category_id].count += 1;
    });

    return Object.values(stats)
      .map((s) => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + "…" : s.name,
        fullName: s.name,
        score: Math.round(s.totalScore / s.count),
        qcm: s.count,
      }))
      .sort((a, b) => b.score - a.score);
  };

  const chartData = categoryStats();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Score moyen : <span className="font-bold text-foreground">{data.score}%</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {data.qcm} QCM complété{data.qcm > 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>

        {/* Progression by Category Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Progression par matière</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.08)" }} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Target className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Complète des QCM pour voir ta progression par matière</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Goal */}
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
                    <div className="text-right">
                      <p className="font-semibold">{attempt.score}/{attempt.total_questions}</p>
                      <p className="text-sm text-muted-foreground">{scorePercent}%</p>
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
