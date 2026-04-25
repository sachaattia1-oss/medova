import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import ProgressChart, { ChartDatum } from "@/components/dashboard/progress/ProgressChart";
import WeeklyGoal from "@/components/dashboard/progress/WeeklyGoal";
import QuizHistory from "@/components/dashboard/progress/QuizHistory";

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
  title: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const CHART_COLORS = [
  "hsl(160, 70%, 45%)", // emerald
  "hsl(180, 65%, 45%)", // teal
  "hsl(200, 70%, 50%)", // sky
  "hsl(265, 60%, 60%)", // purple
  "hsl(45, 85%, 55%)", // amber
  "hsl(330, 70%, 60%)", // pink
  "hsl(15, 75%, 60%)", // orange
  "hsl(220, 65%, 55%)", // blue
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
        const { data: catData } = await supabase
          .from("course_categories")
          .select("id, name")
          .order("order_index");

        if (catData) {
          setCategories(
            catData.reduce((acc, c) => {
              acc[c.id] = c;
              return acc;
            }, {} as Record<string, Category>)
          );
        }

        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, category_id");

        if (coursesData) {
          setCourses(
            coursesData.reduce((acc, c) => {
              acc[c.id] = c;
              return acc;
            }, {} as Record<string, Course>)
          );
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
              .select("id, title, course_id")
              .in("id", quizIds);

            if (quizzesData) {
              setQuizzes(
                quizzesData.reduce((acc, q) => {
                  acc[q.id] = q;
                  return acc;
                }, {} as Record<string, Quiz>)
              );
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

  const completedAttempts = attempts.filter((a) => a.completed_at).length;
  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((acc, a) => {
            if (a.score !== null && a.total_questions !== null && a.total_questions > 0) {
              return acc + (a.score / a.total_questions) * 100;
            }
            return acc;
          }, 0) / attempts.length
        )
      : 0;

  const chartData: ChartDatum[] = (() => {
    const stats: Record<string, { name: string; totalScore: number; count: number }> = {};

    attempts.forEach((attempt) => {
      if (attempt.score === null || attempt.total_questions === null || attempt.total_questions === 0)
        return;
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

    return Object.entries(stats)
      .map(([id, s]) => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + "…" : s.name,
        fullName: s.name,
        score: Math.round(s.totalScore / s.count),
        qcm: s.count,
        colorId: id,
      }))
      .sort((a, b) => b.score - a.score);
  })();

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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {[
            { title: "QCM complétés", value: completedAttempts, icon: Award },
            { title: "Score moyen", value: `${averageScore}%`, icon: TrendingUp },
          ].map((s) => (
            <motion.div
              key={s.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35 }}
            >
              <StatsCard title={s.title} value={s.value} icon={s.icon} />
            </motion.div>
          ))}
        </motion.div>

        <ProgressChart data={chartData} loading={loading} colors={CHART_COLORS} />

        <WeeklyGoal completed={completedAttempts} averageScore={averageScore} />

        <QuizHistory
          attempts={attempts}
          quizzes={quizzes}
          courses={courses}
          categories={categories}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default DashboardProgress;
