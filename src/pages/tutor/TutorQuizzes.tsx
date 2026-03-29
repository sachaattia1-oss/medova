import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, FileQuestion, ChevronRight, BookOpen, AlertCircle, Pencil, GripVertical, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  category_id: string | null;
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  order_index: number | null;
}

interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean | null;
  order_index: number | null;
  explanation: string | null;
}

const TutorQuizzes = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Quiz & questions state (when course is selected)
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Question form
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    explanation: "",
    target_audience: "all",
    is_annale: false,
    annale_year: new Date().getFullYear(),
    answers: [
      { text: "", is_correct: false, explanation: "" },
      { text: "", is_correct: false, explanation: "" },
      { text: "", is_correct: false, explanation: "" },
      { text: "", is_correct: false, explanation: "" },
      { text: "", is_correct: false, explanation: "" },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourseId && user) {
      loadOrCreateQuiz();
    }
  }, [selectedCourseId, user]);

  const fetchData = async () => {
    try {
      const { data: catData } = await supabase
        .from("course_categories")
        .select("id, name")
        .order("order_index");
      if (catData) setCategories(catData);

      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, category_id")
        .order("title");
      if (coursesData) setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateQuiz = async () => {
    if (!selectedCourseId || !user) return;
    setLoadingQuestions(true);

    try {
      // Find existing quiz by this tutor for this course
      const { data: existingQuizzes } = await supabase
        .from("quizzes")
        .select("id")
        .eq("course_id", selectedCourseId)
        .eq("created_by", user.id)
        .limit(1);

      let quizId: string;

      if (existingQuizzes && existingQuizzes.length > 0) {
        quizId = existingQuizzes[0].id;
      } else {
        // Auto-create a quiz for this course
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

      // Fetch questions
      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      setQuestions(questionsData || []);

      // Fetch answers
      if (questionsData && questionsData.length > 0) {
        const questionIds = questionsData.map(q => q.id);
        const { data: answersData } = await supabase
          .from("quiz_answers")
          .select("*")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });

        const answersByQuestion: Record<string, Answer[]> = {};
        (answersData || []).forEach((answer) => {
          if (!answersByQuestion[answer.question_id]) {
            answersByQuestion[answer.question_id] = [];
          }
          answersByQuestion[answer.question_id].push(answer);
        });
        setAnswers(answersByQuestion);
      } else {
        setAnswers({});
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setNewQuestion({
      question_text: "",
      explanation: "",
      target_audience: "all",
      answers: [
        { text: "", is_correct: false, explanation: "" },
        { text: "", is_correct: false, explanation: "" },
        { text: "", is_correct: false, explanation: "" },
        { text: "", is_correct: false, explanation: "" },
        { text: "", is_correct: false, explanation: "" },
      ],
    });
  };

  const openEditDialog = (question: Question) => {
    const questionAnswers = answers[question.id] || [];
    const filledAnswers = Array.from({ length: 5 }, (_, i) => ({
      text: questionAnswers[i]?.answer_text || "",
      is_correct: questionAnswers[i]?.is_correct || false,
      explanation: questionAnswers[i]?.explanation || "",
    }));
    setEditingQuestion(question);
    setNewQuestion({
      question_text: question.question_text,
      explanation: question.explanation || "",
      target_audience: "all",
      answers: filledAnswers,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuizId) return;

    const hasCorrectAnswer = newQuestion.answers.some(a => a.is_correct);
    if (!hasCorrectAnswer) {
      toast.error("Sélectionnez au moins une bonne réponse");
      return;
    }
    const allFilled = newQuestion.answers.every(a => a.text.trim());
    if (!allFilled) {
      toast.error("Remplissez les 5 propositions");
      return;
    }

    setSaving(true);
    try {
      if (editingQuestion) {
        await supabase.from("quiz_questions").update({
          question_text: newQuestion.question_text,
          explanation: newQuestion.explanation || null,
        }).eq("id", editingQuestion.id);

        await supabase.from("quiz_answers").delete().eq("question_id", editingQuestion.id);

        const answersToInsert = newQuestion.answers.map((a, index) => ({
          question_id: editingQuestion.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: index,
          explanation: a.explanation || null,
        }));
        await supabase.from("quiz_answers").insert(answersToInsert);
        toast.success("Question modifiée");
      } else {
        const { data: questionData, error } = await supabase
          .from("quiz_questions")
          .insert({
            quiz_id: currentQuizId,
            question_text: newQuestion.question_text,
            explanation: newQuestion.explanation || null,
            order_index: questions.length,
          })
          .select()
          .single();

        if (error) throw error;

        const answersToInsert = newQuestion.answers.map((a, index) => ({
          question_id: questionData.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: index,
          explanation: a.explanation || null,
        }));
        await supabase.from("quiz_answers").insert(answersToInsert);
        toast.success("Question ajoutée");
      }

      setIsQuestionDialogOpen(false);
      resetForm();
      loadOrCreateQuiz();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await supabase.from("quiz_answers").delete().eq("question_id", questionId);
      await supabase.from("quiz_questions").delete().eq("id", questionId);
      toast.success("Question supprimée");
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const updateAnswerText = (index: number, text: string) => {
    const updated = [...newQuestion.answers];
    updated[index].text = text;
    setNewQuestion({ ...newQuestion, answers: updated });
  };

  const updateAnswerExplanation = (index: number, explanation: string) => {
    const updated = [...newQuestion.answers];
    updated[index].explanation = explanation;
    setNewQuestion({ ...newQuestion, answers: updated });
  };

  const toggleCorrectAnswer = (index: number) => {
    const updated = [...newQuestion.answers];
    updated[index].is_correct = !updated[index].is_correct;
    setNewQuestion({ ...newQuestion, answers: updated });
  };

  // Helpers
  const filteredCourses = selectedCategoryId
    ? courses.filter(c => c.category_id === selectedCategoryId)
    : [];
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const correctAnswersCount = newQuestion.answers.filter(a => a.is_correct).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">QCM</h1>
          <p className="text-muted-foreground">
            Sélectionnez un cours puis ajoutez vos questions
          </p>
        </div>
        {selectedCourseId && currentQuizId && (
          <Button onClick={() => { resetForm(); setIsQuestionDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une question
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedCategoryId || selectedCourseId) && (
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button
            onClick={() => { setSelectedCategoryId(null); setSelectedCourseId(null); setCurrentQuizId(null); setQuestions([]); setAnswers({}); }}
            className="text-accent hover:underline"
          >
            Matières
          </button>
          {selectedCategory && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => { setSelectedCourseId(null); setCurrentQuizId(null); setQuestions([]); setAnswers({}); }}
                className={selectedCourseId ? "text-accent hover:underline" : "text-foreground"}
              >
                {selectedCategory.name}
              </button>
            </>
          )}
          {selectedCourse && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{selectedCourse.title}</span>
            </>
          )}
        </div>
      )}

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsQuestionDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddQuestion} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Énoncé de la question *</Label>
              <Textarea
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                rows={3}
                required
                placeholder="Concernant le métabolisme du glucose, quelle(s) proposition(s) est(sont) exacte(s) ?"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>5 Propositions (cochez les bonnes réponses)</Label>
                <Badge variant={correctAnswersCount > 0 ? "default" : "destructive"}>
                  {correctAnswersCount} bonne{correctAnswersCount > 1 ? "s" : ""} réponse{correctAnswersCount > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Barème : 1pt (0 faute), 0.5pt (1 faute), 0.2pt (2 fautes), 0pt (&gt;2 fautes)</span>
              </div>

              {newQuestion.answers.map((answer, index) => {
                const letter = String.fromCharCode(65 + index);
                return (
                  <div key={index} className="space-y-2 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={answer.is_correct}
                        onCheckedChange={() => toggleCorrectAnswer(index)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className="font-medium text-muted-foreground w-6">{letter}.</span>
                      <Input
                        value={answer.text}
                        onChange={(e) => updateAnswerText(index, e.target.value)}
                        placeholder={`Proposition ${letter}`}
                        className={answer.is_correct ? "border-green-500/50" : ""}
                      />
                    </div>
                    <Textarea
                      value={answer.explanation}
                      onChange={(e) => updateAnswerExplanation(index, e.target.value)}
                      placeholder={`Explication : pourquoi ${letter} est ${answer.is_correct ? "vrai" : "faux"}...`}
                      rows={1}
                      className="ml-9 text-sm"
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Explication (affichée après validation)</Label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                rows={2}
                placeholder="Le glucose est phosphorylé par l'hexokinase..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editingQuestion ? "Modification..." : "Ajout..."}</> : (editingQuestion ? "Modifier" : "Ajouter")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Content */}
      {!selectedCategoryId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length > 0 ? categories.map((category) => {
            const courseCount = courses.filter(c => c.category_id === category.id).length;
            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:border-accent/50 transition-colors"
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{courseCount} cours</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          }) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune catégorie</h3>
              </CardContent>
            </Card>
          )}
        </div>
      ) : !selectedCourseId ? (
        <div className="space-y-4">
          {filteredCourses.length > 0 ? filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => setSelectedCourseId(course.id)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-medium">{course.title}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun cours dans cette catégorie</h3>
              </CardContent>
            </Card>
          )}
        </div>
      ) : loadingQuestions ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        // Questions list for selected course
        <>
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune question</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Ajoutez votre première question pour ce cours
                </p>
                <Button onClick={() => { resetForm(); setIsQuestionDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une question
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                const questionAnswers = answers[question.id] || [];
                const correctCount = questionAnswers.filter(a => a.is_correct).length;

                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                          <Badge variant="secondary">{index + 1}</Badge>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base font-medium">
                            {question.question_text}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {correctCount} bonne{correctCount > 1 ? "s" : ""} réponse{correctCount > 1 ? "s" : ""}
                            </Badge>
                            {question.explanation && (
                              <Badge variant="secondary" className="text-xs">💡 Explication</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(question)}>
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {questionAnswers.map((answer, answerIndex) => {
                          const letter = String.fromCharCode(65 + answerIndex);
                          return (
                            <div
                              key={answer.id}
                              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                answer.is_correct
                                  ? "bg-green-500/10 border border-green-500/30"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {answer.is_correct ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4" />
                              )}
                              <span className="font-medium w-6">{letter}.</span>
                              <span>{answer.answer_text}</span>
                            </div>
                          );
                        })}
                      </div>
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-accent/10 rounded-lg text-sm">
                          💡 {question.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TutorQuizzes;
