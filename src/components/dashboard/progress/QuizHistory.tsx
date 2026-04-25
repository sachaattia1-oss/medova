import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Target } from "lucide-react";

interface Attempt {
  id: string;
  quiz_id: string;
  score: number | null;
  total_questions: number | null;
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

interface Props {
  attempts: Attempt[];
  quizzes: Record<string, Quiz>;
  courses: Record<string, Course>;
  categories: Record<string, Category>;
  loading: boolean;
}

const scoreStyle = (pct: number) => {
  if (pct >= 80) return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (pct >= 50) return "bg-orange-500/15 text-orange-600 border-orange-500/30";
  return "bg-red-500/15 text-red-600 border-red-500/30";
};

const barColor = (pct: number) => {
  if (pct >= 80) return "from-emerald-500 to-teal-500";
  if (pct >= 50) return "from-orange-400 to-orange-500";
  return "from-red-400 to-red-500";
};

const QuizHistory = ({ attempts, quizzes, courses, categories, loading }: Props) => {
  const [filter, setFilter] = useState<string>("all");

  // Build category list of attempts
  const availableCategories = useMemo(() => {
    const set = new Map<string, string>();
    attempts.forEach((a) => {
      const quiz = quizzes[a.quiz_id];
      const course = quiz?.course_id ? courses[quiz.course_id] : null;
      const cat = course?.category_id ? categories[course.category_id] : null;
      if (cat) set.set(cat.id, cat.name);
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [attempts, quizzes, courses, categories]);

  const filtered = useMemo(() => {
    if (filter === "all") return attempts;
    return attempts.filter((a) => {
      const quiz = quizzes[a.quiz_id];
      const course = quiz?.course_id ? courses[quiz.course_id] : null;
      return course?.category_id === filter;
    });
  }, [attempts, filter, quizzes, courses]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-semibold">Historique des QCM</h2>
      </div>

      {/* Filter tabs */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === "all"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
            }`}
          >
            Toutes ({attempts.length})
          </button>
          {availableCategories.map((c) => {
            const count = attempts.filter((a) => {
              const quiz = quizzes[a.quiz_id];
              const course = quiz?.course_id ? courses[quiz.course_id] : null;
              return course?.category_id === c.id;
            }).length;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === c.id
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-xl border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((attempt) => {
              const quiz = quizzes[attempt.quiz_id];
              const course = quiz?.course_id ? courses[quiz.course_id] : null;
              const scorePercent =
                attempt.score !== null && attempt.total_questions !== null && attempt.total_questions > 0
                  ? Math.round((attempt.score / attempt.total_questions) * 100)
                  : 0;
              const title = course ? `Série – ${course.title}` : quiz?.title || "Série QCM";

              return (
                <motion.div
                  key={attempt.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="group bg-card rounded-xl border border-border/50 p-4 hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(attempt.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground hidden sm:inline">
                        {attempt.score}/{attempt.total_questions}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${scoreStyle(
                          scorePercent
                        )}`}
                      >
                        {scorePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${barColor(scorePercent)}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Aucun QCM dans cette catégorie</h3>
          <p className="text-sm text-muted-foreground">
            Commence un QCM pour suivre ta progression.
          </p>
        </div>
      )}
    </section>
  );
};

export default QuizHistory;
