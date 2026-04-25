import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Target,
  Sparkles,
  Trophy,
  Flame,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  category: string | null;
}

interface Course {
  id: string;
  title: string;
  category: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

// UE color mapping (HSL via tailwind arbitrary values would lose dynamic — we use class maps)
type UEKey = "UE1" | "UE2" | "UE3" | "UE4" | "UE5" | "UE6" | "UE7";

const UE_LIST: UEKey[] = ["UE1", "UE2", "UE3", "UE4", "UE5", "UE6", "UE7"];

const UE_META: Record<
  UEKey,
  {
    label: string;
    description: string;
    gradient: string; // tailwind classes
    ring: string;
    text: string;
    bg: string;
    barFrom: string;
    barTo: string;
    glow: string;
  }
> = {
  UE1: {
    label: "UE1",
    description: "Atomes, biomolécules, génome",
    gradient: "from-blue-500 to-blue-600",
    ring: "ring-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    barFrom: "from-blue-500",
    barTo: "to-blue-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(217_91%_60%/0.5)]",
  },
  UE2: {
    label: "UE2",
    description: "La cellule et les tissus",
    gradient: "from-violet-500 to-purple-600",
    ring: "ring-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    barFrom: "from-violet-500",
    barTo: "to-purple-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(262_83%_58%/0.5)]",
  },
  UE3: {
    label: "UE3",
    description: "Organisation des appareils",
    gradient: "from-emerald-500 to-green-600",
    ring: "ring-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    barFrom: "from-emerald-500",
    barTo: "to-green-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(160_84%_39%/0.5)]",
  },
  UE4: {
    label: "UE4",
    description: "Évaluation des méthodes",
    gradient: "from-orange-500 to-amber-600",
    ring: "ring-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    barFrom: "from-orange-500",
    barTo: "to-amber-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(25_95%_53%/0.5)]",
  },
  UE5: {
    label: "UE5",
    description: "Organisation des appareils 2",
    gradient: "from-rose-500 to-red-600",
    ring: "ring-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    barFrom: "from-rose-500",
    barTo: "to-red-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(346_84%_56%/0.5)]",
  },
  UE6: {
    label: "UE6",
    description: "Initiation à la connaissance du médicament",
    gradient: "from-cyan-500 to-teal-600",
    ring: "ring-cyan-500/30",
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    barFrom: "from-cyan-500",
    barTo: "to-teal-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(189_94%_43%/0.5)]",
  },
  UE7: {
    label: "UE7",
    description: "Santé, société, humanité",
    gradient: "from-pink-500 to-fuchsia-600",
    ring: "ring-pink-500/30",
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10",
    barFrom: "from-pink-500",
    barTo: "to-fuchsia-600",
    glow: "shadow-[0_8px_30px_-10px_hsl(330_81%_60%/0.5)]",
  },
};

function getLevel(score: number) {
  if (score >= 80) return { label: "Excellent", icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (score >= 60) return { label: "Bien", icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (score >= 40) return { label: "En cours", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" };
  return { label: "À revoir", icon: Target, color: "text-rose-500", bg: "bg-rose-500/10" };
}

// Detect UE in a string (category or title)
function detectUE(...strings: (string | null | undefined)[]): UEKey | null {
  for (const s of strings) {
    if (!s) continue;
    const match = s.toUpperCase().match(/UE\s*([1-7])/);
    if (match) return `UE${match[1]}` as UEKey;
  }
  return null;
}

const DashboardProgress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, category, category_id");
        if (coursesData) {
          setCourses(coursesData.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}));
        }

        const { data: attemptsData } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (attemptsData) {
          setAttempts(attemptsData);
          const quizIds = [...new Set(attemptsData.map((a) => a.quiz_id))];
          if (quizIds.length > 0) {
            const { data: quizzesData } = await supabase
              .from("quizzes")
              .select("id, title, course_id, category")
              .in("id", quizIds);
            if (quizzesData) {
              setQuizzes(quizzesData.reduce((acc, q) => ({ ...acc, [q.id]: q }), {}));
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

  // Global stats
  const completedAttempts = attempts.filter((a) => a.completed_at).length;
  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((acc, a) => {
            if (a.score !== null && a.total_questions !== null && a.total_questions > 0) {
              return acc + (a.score / a.total_questions) * 100;
            }
            return acc;
          }, 0) / attempts.length,
        )
      : 0;

  const bestScore =
    attempts.length > 0
      ? Math.max(
          ...attempts.map((a) =>
            a.score !== null && a.total_questions !== null && a.total_questions > 0
              ? Math.round((a.score / a.total_questions) * 100)
              : 0,
          ),
        )
      : 0;

  // UE stats
  const ueStats: Record<UEKey, { totalScore: number; count: number }> = UE_LIST.reduce(
    (acc, ue) => ({ ...acc, [ue]: { totalScore: 0, count: 0 } }),
    {} as Record<UEKey, { totalScore: number; count: number }>,
  );

  attempts.forEach((attempt) => {
    if (attempt.score === null || attempt.total_questions === null || attempt.total_questions === 0) return;
    const quiz = quizzes[attempt.quiz_id];
    if (!quiz) return;
    const course = quiz.course_id ? courses[quiz.course_id] : null;
    const ue = detectUE(quiz.category, quiz.title, course?.category, course?.title);
    if (!ue) return;
    ueStats[ue].totalScore += (attempt.score / attempt.total_questions) * 100;
    ueStats[ue].count += 1;
  });

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
          description="Suis ton évolution par UE et améliore tes performances"
        />

        {/* Premium hero stats */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-accent/10 via-card to-card p-6 md:p-8">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Award className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">QCM complétés</p>
                <p className="text-3xl font-bold tabular-nums">{completedAttempts}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-3xl font-bold tabular-nums">{averageScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meilleur score</p>
                <p className="text-3xl font-bold tabular-nums">{bestScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progression par UE */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">Progression par UE</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tes résultats détaillés pour chaque unité d'enseignement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {UE_LIST.map((ue) => {
              const meta = UE_META[ue];
              const stat = ueStats[ue];
              const score = stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0;
              const level = getLevel(score);
              const LevelIcon = level.icon;
              const hasData = stat.count > 0;

              return (
                <div
                  key={ue}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:-translate-y-1",
                    hasData && meta.glow,
                    "hover:border-transparent hover:ring-2",
                    hasData && meta.ring,
                  )}
                >
                  {/* Decorative gradient blob */}
                  <div
                    className={cn(
                      "absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity blur-2xl",
                      meta.gradient,
                    )}
                  />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg",
                          meta.gradient,
                        )}
                      >
                        {meta.label}
                      </div>
                      {hasData && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            level.bg,
                            level.color,
                          )}
                        >
                          <LevelIcon className="w-3.5 h-3.5" />
                          {level.label}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2rem]">
                      {meta.description}
                    </p>

                    {/* Score */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Score moyen</span>
                      <span className={cn("text-2xl font-bold tabular-nums", hasData ? meta.text : "text-muted-foreground")}>
                        {score}%
                      </span>
                    </div>

                    {/* Custom gradient progress bar */}
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                          meta.barFrom,
                          meta.barTo,
                        )}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {stat.count} QCM{stat.count > 1 ? "s" : ""} complété{stat.count > 1 ? "s" : ""}
                        </span>
                      </div>
                      {!hasData && (
                        <span className="text-xs text-muted-foreground/60 italic">À démarrer</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weekly Goal */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Objectif de la semaine</h3>
          </div>
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
                const course = quiz?.course_id ? courses[quiz.course_id] : null;
                const ue = detectUE(quiz?.category, quiz?.title, course?.category, course?.title);
                const ueMeta = ue ? UE_META[ue] : null;
                const scorePercent =
                  attempt.score !== null && attempt.total_questions !== null && attempt.total_questions > 0
                    ? Math.round((attempt.score / attempt.total_questions) * 100)
                    : 0;
                const isPassed = scorePercent >= 50;

                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-card-hover transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isPassed ? "bg-emerald-500/10" : "bg-rose-500/10",
                        )}
                      >
                        {isPassed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {course ? `Série – ${course.title}` : quiz?.title || "Série QCM"}
                          </p>
                          {ueMeta && (
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-md text-white bg-gradient-to-r",
                                ueMeta.gradient,
                              )}
                            >
                              {ueMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(attempt.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {attempt.score}/{attempt.total_questions}
                      </p>
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
              <p className="text-sm text-muted-foreground">Commence un QCM pour suivre ta progression.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardProgress;
