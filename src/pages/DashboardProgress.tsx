import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarRange,
  BookOpen,
  Layers,
  CheckCircle2,
  Target,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import AnnaleBarChart, { AnnaleDatum } from "@/components/dashboard/progress/AnnaleBarChart";
import AnnaleEvolution, {
  EvolutionDatum,
} from "@/components/dashboard/progress/AnnaleEvolution";

interface AnnaleQuestion {
  id: string;
  quiz_id: string;
  annale_year: number | null;
}

interface AttemptRow {
  id: string;
  quiz_id: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string | null;
  created_at: string;
  answers_data: any;
}

interface AnnaleResult {
  id: string;
  date: string;
  /** score out of 100 */
  score: number;
  questions: number;
  year: number | null;
  courseId: string | null;
  courseTitle: string;
  categoryId: string | null;
  categoryName: string;
}

const mostFrequent = <T,>(values: T[]): T | null => {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const groupToData = (
  results: AnnaleResult[],
  keyOf: (r: AnnaleResult) => string | null,
  labelOf: (r: AnnaleResult) => string,
  shortLen: number
): AnnaleDatum[] => {
  const groups = new Map<string, { label: string; total: number; count: number }>();
  results.forEach((r) => {
    const key = keyOf(r);
    if (!key) return;
    const g = groups.get(key) || { label: labelOf(r), total: 0, count: 0 };
    g.total += r.score;
    g.count += 1;
    groups.set(key, g);
  });
  return [...groups.entries()].map(([key, g]) => {
    const score = Math.round(g.total / g.count);
    return {
      name: truncate(g.label, shortLen),
      fullName: g.label,
      score,
      score20: Math.round((score / 5) * 10) / 10,
      count: g.count,
      colorId: key.replace(/[^a-zA-Z0-9]/g, ""),
    };
  });
};

const DashboardProgress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<AnnaleResult[]>([]);
  const [totalAnnales, setTotalAnnales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [{ data: annaleQuestions }, { data: attemptsData }] = await Promise.all([
          supabase
            .from("quiz_questions")
            .select("id, quiz_id, annale_year")
            .eq("is_annale", true),
          supabase
            .from("quiz_attempts")
            .select("id, quiz_id, score, total_questions, completed_at, created_at, answers_data")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        ]);

        const questions = (annaleQuestions || []) as AnnaleQuestion[];
        setTotalAnnales(questions.length);

        const questionById = new Map(questions.map((q) => [q.id, q]));

        const attempts = (attemptsData || []) as AttemptRow[];

        // Keep only attempts that contain annale questions
        const annaleAttempts = attempts
          .map((a) => {
            const raw = a.answers_data;
            const ids: string[] = Array.isArray(raw)
              ? raw.map((x: any) => x.questionId || x.question_id).filter(Boolean)
              : raw && typeof raw === "object"
                ? Object.keys(raw)
                : [];
            const annaleQs = ids
              .map((id) => questionById.get(id))
              .filter((q): q is AnnaleQuestion => Boolean(q));
            return { attempt: a, annaleQs };
          })
          .filter(
            ({ attempt, annaleQs }) =>
              annaleQs.length > 0 &&
              attempt.score !== null &&
              attempt.total_questions !== null &&
              attempt.total_questions > 0
          );

        // Resolve courses + categories for the involved quizzes
        const quizIds = [
          ...new Set(annaleAttempts.flatMap(({ annaleQs }) => annaleQs.map((q) => q.quiz_id))),
        ];

        const quizToCourse = new Map<string, string | null>();
        const courseInfo = new Map<
          string,
          { title: string; categoryId: string | null; categoryName: string }
        >();

        if (quizIds.length > 0) {
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id, course_id")
            .in("id", quizIds);
          (quizzes || []).forEach((q) => quizToCourse.set(q.id, q.course_id));

          const courseIds = [
            ...new Set((quizzes || []).map((q) => q.course_id).filter(Boolean) as string[]),
          ];
          if (courseIds.length > 0) {
            const { data: courses } = await supabase
              .from("courses")
              .select("id, title, category_id")
              .in("id", courseIds);
            const catIds = [
              ...new Set((courses || []).map((c) => c.category_id).filter(Boolean) as string[]),
            ];
            const catNames = new Map<string, string>();
            if (catIds.length > 0) {
              const { data: cats } = await supabase
                .from("course_categories")
                .select("id, name")
                .in("id", catIds);
              (cats || []).forEach((c) => catNames.set(c.id, c.name));
            }
            (courses || []).forEach((c) =>
              courseInfo.set(c.id, {
                title: c.title,
                categoryId: c.category_id,
                categoryName: c.category_id
                  ? catNames.get(c.category_id) || "Autre matière"
                  : "Autre matière",
              })
            );
          }
        }

        const built: AnnaleResult[] = annaleAttempts.map(({ attempt, annaleQs }) => {
          const year = mostFrequent(
            annaleQs.map((q) => q.annale_year).filter((y): y is number => y !== null)
          );
          const courseId = mostFrequent(
            annaleQs
              .map((q) => quizToCourse.get(q.quiz_id) || null)
              .filter((c): c is string => Boolean(c))
          );
          const info = courseId ? courseInfo.get(courseId) : undefined;
          return {
            id: attempt.id,
            date: attempt.completed_at || attempt.created_at,
            score: Math.round((attempt.score! / attempt.total_questions!) * 100),
            questions: attempt.total_questions!,
            year,
            courseId,
            courseTitle: info?.title || "Cours inconnu",
            categoryId: info?.categoryId || null,
            categoryName: info?.categoryName || "Autre matière",
          };
        });

        setResults(built);
      } catch (error) {
        console.error("Error fetching annale progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const done = results.length;
  const avg100 = done > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / done) : null;
  const avg20 = avg100 !== null ? Math.round((avg100 / 5) * 10) / 10 : null;
  const best = done > 0 ? Math.max(...results.map((r) => r.score)) : null;

  const byYear = useMemo(
    () =>
      groupToData(
        results,
        (r) => (r.year !== null ? String(r.year) : null),
        (r) => `${r.year}-${(r.year as number) + 1}`,
        12
      ).sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [results]
  );

  const bySubject = useMemo(
    () =>
      groupToData(results, (r) => r.categoryId, (r) => r.categoryName, 20).sort(
        (a, b) => b.score - a.score
      ),
    [results]
  );

  const byCourse = useMemo(
    () =>
      groupToData(results, (r) => r.courseId, (r) => r.courseTitle, 22).sort(
        (a, b) => b.score - a.score
      ),
    [results]
  );

  const evolution: EvolutionDatum[] = useMemo(
    () =>
      results.map((r) => ({
        label: new Date(r.date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        score: r.score,
        score20: r.score / 5,
        title: `${r.courseTitle}${r.year ? ` · ${r.year}-${r.year + 1}` : ""}`,
      })),
    [results]
  );

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
          title="Ma progression"
          description="Tes résultats aux annales, par année et par cours, notés sur 100 et sur 20"
        />

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          {[
            {
              title: "Annales réalisées",
              value: done,
              icon: CheckCircle2,
              paletteIndex: 0,
            },
            {
              title: "Moyenne sur 20",
              value: avg20 !== null ? `${avg20}/20` : "—",
              icon: Target,
              paletteIndex: 1,
            },
            {
              title: "Moyenne sur 100",
              value: avg100 !== null ? `${avg100}/100` : "—",
              icon: Layers,
              paletteIndex: 2,
            },
            {
              title: "Meilleure note",
              value:
                best !== null ? `${(best / 5).toFixed(1)}/20 · ${best}/100` : "—",
              icon: Trophy,
              paletteIndex: 3,
            },
          ].map((s) => (
            <motion.div
              key={s.title}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.35 }}
            >
              <StatsCard
                title={s.title}
                value={s.value}
                icon={s.icon}
                paletteIndex={s.paletteIndex}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AnnaleBarChart
            title="Moyenne par année d'annales"
            icon={CalendarRange}
            data={byYear}
            loading={loading}
            idPrefix="year"
            emptyLabel="Réalise des annales pour voir tes moyennes par année"
          />
          <AnnaleBarChart
            title="Moyenne par matière"
            icon={Layers}
            data={bySubject}
            loading={loading}
            layout="horizontal"
            idPrefix="subject"
            emptyLabel="Réalise des annales pour voir tes moyennes par matière"
          />
        </div>

        <div className="mb-6">
          <AnnaleBarChart
            title="Moyenne par cours"
            icon={BookOpen}
            data={byCourse}
            loading={loading}
            layout="horizontal"
            idPrefix="course"
            emptyLabel="Réalise des annales pour voir tes moyennes cours par cours"
          />
        </div>

        <div className="mb-6">
          <AnnaleEvolution data={evolution} loading={loading} />
        </div>

        {/* Call to action */}
        <Card className="border-border/50 bg-gradient-to-r from-accent/10 to-transparent mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                {done === 0 ? "Commence par une première annale" : "Continue sur ta lancée"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {totalAnnales} question{totalAnnales > 1 ? "s" : ""} d'annales disponibles, triées
                par année et par cours.
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/annales")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
            >
              Faire des annales
              <ArrowRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardProgress;
