import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  category_id: string | null;
  quizId: string | null;
}

interface AnnaleQuestion {
  id: string;
  question_text: string;
  annale_year: number | null;
  quiz_id: string;
}

const AdminGestionAnnales = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<AnnaleQuestion[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({});

  const [editing, setEditing] = useState<AnnaleQuestion | null>(null);
  const [targetCourseId, setTargetCourseId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!user) return;

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) {
        toast.error("Accès refusé");
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      fetchData();
    };
    check();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cats }, { data: cs }, { data: qz }, { data: qs }] = await Promise.all([
      supabase.from("course_categories").select("id, name").order("order_index"),
      supabase.from("courses").select("id, title, category_id").order("order_index"),
      supabase.from("quizzes").select("id, course_id"),
      supabase
        .from("quiz_questions")
        .select("id, question_text, annale_year, quiz_id")
        .eq("is_annale", true)
        .order("order_index"),
    ]);

    const quizByCourse: Record<string, string> = {};
    (qz || []).forEach((q) => {
      if (q.course_id && !quizByCourse[q.course_id]) quizByCourse[q.course_id] = q.id;
    });

    setCategories(cats || []);
    setCourses(
      (cs || []).map((c) => ({
        id: c.id,
        title: c.title,
        category_id: c.category_id,
        quizId: quizByCourse[c.id] || null,
      }))
    );
    setQuestions(qs || []);
    setLoading(false);
  };

  const quizToCourse = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      if (c.quizId) map[c.quizId] = c;
    });
    return map;
  }, [courses]);

  const grouped = useMemo(() => {
    const byCategory: Record<string, Record<string, AnnaleQuestion[]>> = {};
    questions.forEach((q) => {
      const course = quizToCourse[q.quiz_id];
      const catId = course?.category_id || "sans-categorie";
      const courseId = course?.id || "sans-cours";
      if (!byCategory[catId]) byCategory[catId] = {};
      if (!byCategory[catId][courseId]) byCategory[catId][courseId] = [];
      byCategory[catId][courseId].push(q);
    });
    return byCategory;
  }, [questions, quizToCourse]);

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => (map[c.id] = c));
    return map;
  }, [courses]);

  const openEdit = (q: AnnaleQuestion) => {
    setEditing(q);
    setTargetCourseId(quizToCourse[q.quiz_id]?.id || "");
  };

  const save = async () => {
    if (!editing || !targetCourseId) return;
    const target = courseById[targetCourseId];
    if (!target) return;

    setSaving(true);
    try {
      let quizId = target.quizId;
      if (!quizId) {
        const { data: newQuiz, error } = await supabase
          .from("quizzes")
          .insert({
            title: `${target.title} - QCM`,
            course_id: target.id,
            target_audience: "tous",
            created_by: user!.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        quizId = newQuiz.id;
      }

      const { error } = await supabase
        .from("quiz_questions")
        .update({ quiz_id: quizId })
        .eq("id", editing.id);
      if (error) throw error;

      toast.success("Annale déplacée vers le nouveau cours");
      setEditing(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du déplacement");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const orderedCategories = [
    ...categories,
    ...(grouped["sans-categorie"] ? [{ id: "sans-categorie", name: "Sans matière" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <DashboardHeader
          title="Gestion des annales"
          description="Annales triées par matière puis par cours — cliquez sur une annale pour changer son cours"
        />

        {orderedCategories.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <p className="text-sm text-muted-foreground">Aucune annale publiée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orderedCategories.map((cat) => {
              const coursesMap = grouped[cat.id];
              if (!coursesMap) return null;
              const catOpen = openCategories[cat.id] !== false;
              const catCount = Object.values(coursesMap).reduce((s, arr) => s + arr.length, 0);

              const courseEntries = Object.entries(coursesMap).sort(([a], [b]) => {
                const ta = a === "sans-cours" ? "zzz" : courseById[a]?.title || "zzz";
                const tb = b === "sans-cours" ? "zzz" : courseById[b]?.title || "zzz";
                return ta.localeCompare(tb, "fr");
              });

              return (
                <Card key={cat.id}>
                  <CardContent className="p-0">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left"
                      onClick={() =>
                        setOpenCategories((o) => ({ ...o, [cat.id]: !catOpen }))
                      }
                    >
                      {catOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <BookOpen className="w-5 h-5 text-accent" />
                      <span className="font-semibold flex-1">{cat.name}</span>
                      <Badge variant="secondary">{catCount} annale{catCount > 1 ? "s" : ""}</Badge>
                    </button>

                    {catOpen && (
                      <div className="border-t border-border/50 divide-y divide-border/50">
                        {courseEntries.map(([courseId, qs]) => {
                          const course = courseById[courseId];
                          const courseOpen = openCourses[courseId] !== false;
                          return (
                            <div key={courseId}>
                              <button
                                className="w-full flex items-center gap-3 px-4 py-3 pl-10 text-left hover:bg-muted/50"
                                onClick={() =>
                                  setOpenCourses((o) => ({ ...o, [courseId]: !courseOpen }))
                                }
                              >
                                {courseOpen ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="font-medium text-sm flex-1">
                                  {course?.title || "Sans cours"}
                                </span>
                                <Badge variant="outline">{qs.length}</Badge>
                              </button>

                              {courseOpen && (
                                <div className="px-4 pb-3 pl-14 space-y-2">
                                  {qs.map((q) => (
                                    <button
                                      key={q.id}
                                      onClick={() => openEdit(q)}
                                      className="w-full flex items-start gap-3 rounded-lg border border-border/50 p-3 text-left hover:border-accent/50 hover:bg-accent/5 transition-colors group"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm line-clamp-2">{q.question_text}</p>
                                        {q.annale_year && (
                                          <span className="text-xs text-muted-foreground">
                                            Annale {q.annale_year}
                                          </span>
                                        )}
                                      </div>
                                      <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0 mt-0.5" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le cours rattaché</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {editing.question_text}
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cours actuel</label>
                  <p className="text-sm text-muted-foreground">
                    {quizToCourse[editing.quiz_id]?.title || "Sans cours"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nouveau cours</label>
                  <Select value={targetCourseId} onValueChange={setTargetCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <div key={cat.id}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {cat.name}
                          </div>
                          {courses
                            .filter((c) => c.category_id === cat.id)
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.title}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button onClick={save} disabled={saving || !targetCourseId}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminGestionAnnales;
