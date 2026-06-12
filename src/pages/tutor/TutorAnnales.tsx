import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Pencil,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; }
interface Course { id: string; title: string; category_id: string | null; }
interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  order_index: number | null;
  annale_year?: number | null;
}
interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean | null;
  order_index: number | null;
  explanation: string | null;
}

const currentYear = new Date().getFullYear();

const TutorAnnales = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    question_text: "",
    explanation: "",
    annale_year: currentYear,
    answers: Array.from({ length: 5 }, () => ({ text: "", is_correct: false, explanation: "" })),
  });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (selectedCourseId && user) loadOrCreateQuiz(); }, [selectedCourseId, user]);

  const fetchData = async () => {
    try {
      const [{ data: c }, { data: co }] = await Promise.all([
        supabase.from("course_categories").select("id, name").order("order_index"),
        supabase.from("courses").select("id, title, category_id").order("title"),
      ]);
      setCategories(c || []);
      setCourses(co || []);
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateQuiz = async () => {
    if (!selectedCourseId || !user) return;
    setLoadingQuestions(true);
    try {
      let q = supabase.from("quizzes").select("id, created_by").eq("course_id", selectedCourseId);
      if (!isAdmin) q = q.eq("created_by", user.id);
      const { data: existing } = await q.limit(1);

      let quizId: string;
      if (existing && existing.length > 0) {
        quizId = existing[0].id;
      } else {
        const courseName = courses.find(c => c.id === selectedCourseId)?.title || "Quiz";
        const { data, error } = await supabase.from("quizzes").insert({
          title: `${courseName} - QCM`,
          course_id: selectedCourseId,
          target_audience: "all",
          created_by: user.id,
        }).select().single();
        if (error) throw error;
        quizId = data.id;
      }
      setCurrentQuizId(quizId);

      // Only annale questions
      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("is_annale", true)
        .order("order_index", { ascending: true });
      setQuestions(qs || []);

      if (qs && qs.length > 0) {
        const ids = qs.map(q => q.id);
        const { data: ans } = await supabase
          .from("quiz_answers")
          .select("*")
          .in("question_id", ids)
          .order("order_index", { ascending: true });
        const byQ: Record<string, Answer[]> = {};
        (ans || []).forEach(a => {
          (byQ[a.question_id] ||= []).push(a);
        });
        setAnswers(byQ);
      } else {
        setAnswers({});
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setForm({
      question_text: "",
      explanation: "",
      annale_year: currentYear,
      answers: Array.from({ length: 5 }, () => ({ text: "", is_correct: false, explanation: "" })),
    });
  };

  const openEdit = (q: Question) => {
    const qa = answers[q.id] || [];
    setEditingQuestion(q);
    setForm({
      question_text: q.question_text,
      explanation: q.explanation || "",
      annale_year: q.annale_year || currentYear,
      answers: Array.from({ length: 5 }, (_, i) => ({
        text: qa[i]?.answer_text || "",
        is_correct: qa[i]?.is_correct || false,
        explanation: qa[i]?.explanation || "",
      })),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuizId) return;
    if (!form.answers.some(a => a.is_correct)) {
      toast.error("Sélectionnez au moins une bonne réponse"); return;
    }
    if (!form.answers.every(a => a.text.trim())) {
      toast.error("Remplissez les 5 propositions"); return;
    }
    setSaving(true);
    try {
      if (editingQuestion) {
        await supabase.from("quiz_questions").update({
          question_text: form.question_text,
          explanation: form.explanation || null,
          is_annale: true,
          annale_year: form.annale_year,
        }).eq("id", editingQuestion.id);
        await supabase.from("quiz_answers").delete().eq("question_id", editingQuestion.id);
        await supabase.from("quiz_answers").insert(form.answers.map((a, i) => ({
          question_id: editingQuestion.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: i,
          explanation: a.explanation || null,
        })));
        toast.success("Question modifiée");
      } else {
        const { data: qd, error } = await supabase.from("quiz_questions").insert({
          quiz_id: currentQuizId,
          question_text: form.question_text,
          explanation: form.explanation || null,
          order_index: questions.length,
          is_annale: true,
          annale_year: form.annale_year,
        }).select().single();
        if (error) throw error;
        await supabase.from("quiz_answers").insert(form.answers.map((a, i) => ({
          question_id: qd.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: i,
          explanation: a.explanation || null,
        })));
        toast.success("Question d'annale ajoutée");
      }
      setIsDialogOpen(false);
      resetForm();
      loadOrCreateQuiz();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await supabase.from("quiz_answers").delete().eq("question_id", id);
      await supabase.from("quiz_questions").delete().eq("id", id);
      toast.success("Question supprimée");
      setQuestions(questions.filter(q => q.id !== id));
    } catch { toast.error("Erreur lors de la suppression"); }
  };

  const updateAns = (i: number, field: "text" | "is_correct" | "explanation", value: any) => {
    const arr = [...form.answers];
    (arr[i] as any)[field] = value;
    setForm({ ...form, answers: arr });
  };

  const filteredCourses = selectedCategoryId ? courses.filter(c => c.category_id === selectedCategoryId) : [];
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const correctCount = form.answers.filter(a => a.is_correct).length;
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - 1 - i);
  const yearPair = (y: number) => `${y}-${y + 1}`;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Publier des annales</h1>
          <p className="text-muted-foreground">Choisissez une matière, puis un cours, et ajoutez vos questions d'annales</p>
        </div>
        {selectedCourseId && currentQuizId && (
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Ajouter une question
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedCategoryId || selectedCourseId) && (
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button onClick={() => { setSelectedCategoryId(null); setSelectedCourseId(null); setCurrentQuizId(null); setQuestions([]); setAnswers({}); }} className="text-accent hover:underline">Matières</button>
          {selectedCategory && (<>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button onClick={() => { setSelectedCourseId(null); setCurrentQuizId(null); setQuestions([]); setAnswers({}); }} className={selectedCourseId ? "text-accent hover:underline" : "text-foreground"}>{selectedCategory.name}</button>
          </>)}
          {selectedCourse && (<>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{selectedCourse.title}</span>
          </>)}
        </div>
      )}

      {/* Step 1: choose category */}
      {!selectedCategoryId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Card key={cat.id} className="cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all" onClick={() => setSelectedCategoryId(cat.id)}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10"><BookOpen className="w-6 h-6 text-accent" /></div>
                <div className="flex-1"><h3 className="font-semibold">{cat.name}</h3></div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: choose course */}
      {selectedCategoryId && !selectedCourseId && (
        filteredCourses.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucun cours dans cette matière</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCourses.map(co => (
              <Card key={co.id} className="cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all" onClick={() => setSelectedCourseId(co.id)}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 shrink-0"><FileText className="w-6 h-6 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-snug break-words">{co.title}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Step 3: questions list */}
      {selectedCourseId && (
        loadingQuestions ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Aucune question d'annale pour ce cours</p>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter la première question
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card key={q.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <Badge variant="secondary" className="shrink-0">Q{idx + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {q.annale_year && <Badge variant="outline" className="text-xs">📝 Annale {yearPair(q.annale_year)}</Badge>}
                      <span className="text-xs text-muted-foreground">{(answers[q.id] || []).length} propositions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Question dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setIsDialogOpen(o); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Modifier la question" : "Nouvelle question d'annale"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Énoncé de la question *</Label>
              <Textarea
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                rows={3}
                required
                placeholder="Énoncé de la question d'annale..."
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
              <Label className="text-sm">📝 Année de l'annale :</Label>
              <Select value={form.annale_year.toString()} onValueChange={(v) => setForm({ ...form, annale_year: parseInt(v) })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>5 Propositions (cochez les bonnes réponses)</Label>
                <Badge variant={correctCount > 0 ? "default" : "destructive"}>
                  {correctCount} bonne{correctCount > 1 ? "s" : ""} réponse{correctCount > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Barème : 1pt (0 faute), 0.5pt (1 faute), 0.2pt (2 fautes), 0pt (&gt;2 fautes)</span>
              </div>
              {form.answers.map((a, i) => {
                const letter = String.fromCharCode(65 + i);
                return (
                  <div key={i} className="space-y-2 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={a.is_correct}
                        onCheckedChange={(c) => updateAns(i, "is_correct", !!c)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className="font-medium text-muted-foreground w-6">{letter}.</span>
                      <Input
                        value={a.text}
                        onChange={(e) => updateAns(i, "text", e.target.value)}
                        placeholder={`Proposition ${letter}`}
                        className={a.is_correct ? "border-green-500/50" : ""}
                      />
                    </div>
                    <Textarea
                      value={a.explanation}
                      onChange={(e) => updateAns(i, "explanation", e.target.value)}
                      placeholder={`Explication (facultatif) pour la proposition ${letter}`}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Explication générale (facultatif)</Label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingQuestion ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorAnnales;
