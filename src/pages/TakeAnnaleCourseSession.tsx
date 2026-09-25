import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import AnnaleCorrectionCard from "@/components/quiz/AnnaleCorrectionCard";
import QuestionImage from "@/components/QuestionImage";

interface Question {
  id: string;
  question_text: string;
  explanation: string | null;
  image_url: string | null;
  year: number | null;
  order_index: number | null;
}

interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  order_index: number | null;
}

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
}

interface QuestionResult {
  questionId: string;
  score: number;
  errors: number;
  correctAnswerIds: string[];
  selectedAnswerIds: string[];
}

const TakeAnnaleCourseSession = () => {
  const { categoryId, courseId } = useParams<{ categoryId: string; courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [courseTitle, setCourseTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [startTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      try {
        const { data: course } = await supabase
          .from("courses")
          .select("title")
          .eq("id", courseId)
          .maybeSingle();
        setCourseTitle(course?.title || "Cours");

        const { data, error } = await supabase
          .from("quiz_questions")
          .select("id, question_text, explanation, image_url, order_index, annale_year, quizzes!inner(id, course_id)")
          .eq("is_annale", true)
          .eq("quizzes.course_id", courseId);
        if (error) throw error;

        const qs: Question[] = (data || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation,
          image_url: q.image_url ?? null,
          year: q.annale_year ?? null,
          order_index: q.order_index ?? null,
        }));
        // Années décroissantes, puis ordre des questions
        qs.sort((a, b) => {
          const ya = a.year ?? -Infinity;
          const yb = b.year ?? -Infinity;
          if (ya !== yb) return yb - ya;
          return (a.order_index ?? 0) - (b.order_index ?? 0);
        });
        setQuestions(qs);
        setUserAnswers(qs.map((q) => ({ questionId: q.id, selectedAnswerIds: [] })));

        if (qs.length > 0) {
          const { data: answersData } = await supabase
            .from("quiz_answers_public")
            .select("*")
            .in("question_id", qs.map((q) => q.id))
            .order("order_index", { ascending: true });
          const byQuestion: Record<string, Answer[]> = {};
          (answersData || []).forEach((a: Answer) => {
            if (!byQuestion[a.question_id]) byQuestion[a.question_id] = [];
            byQuestion[a.question_id].push(a);
          });
          setAnswers(byQuestion);
        }
      } catch (e) {
        console.error(e);
        toast.error("Erreur lors du chargement des annales");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const toggleAnswer = (questionId: string, answerId: string) => {
    setUserAnswers((prev) =>
      prev.map((ua) =>
        ua.questionId === questionId
          ? {
              ...ua,
              selectedAnswerIds: ua.selectedAnswerIds.includes(answerId)
                ? ua.selectedAnswerIds.filter((id) => id !== answerId)
                : [...ua.selectedAnswerIds, answerId],
            }
          : ua
      )
    );
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-quiz", {
        body: {
          questionIds: questions.map((q) => q.id),
          isSeries: true,
          userAnswers,
          timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
        },
      });
      if (error) throw error;
      const response = data as { success: boolean; totalScore: number; results: QuestionResult[] };
      if (!response.success) throw new Error("Validation échouée");

      setResults(response.results);
      setTotalScore(response.totalScore);
      const map: Record<string, string[]> = {};
      response.results.forEach((r) => (map[r.questionId] = r.correctAnswerIds));
      setCorrectAnswersMap(map);
      setIsSubmitted(true);
      window.scrollTo({ top: 0 });
      toast.success("Annales terminées !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la validation");
    } finally {
      setSaving(false);
    }
  };

  const backUrl = `/dashboard/annales/par-matiere/${categoryId}`;
  const yearLabel = (y: number | null) => (y ? `${y}-${y + 1}` : "Année non précisée");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucune annale</h2>
            <p className="text-muted-foreground mb-4">Il n'y a pas encore d'annale pour ce cours.</p>
            <Button onClick={() => navigate(backUrl)}>Retour</Button>
          </div>
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    const percentage = (totalScore / questions.length) * 100;
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-accent mb-4" />
                <CardTitle className="text-2xl">Annales — {courseTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-5xl font-bold text-accent mb-2">
                  {((totalScore / questions.length) * 20).toFixed(1).replace(".", ",")} / 20
                </div>
                <p className="text-muted-foreground mb-4">
                  {percentage.toFixed(0)} / 100 · {totalScore.toFixed(1).replace(".", ",")} point(s) sur {questions.length} question(s)
                </p>
                <p className="text-xs text-muted-foreground mb-4">Barème : 1 pt sans erreur · 0,5 pt pour 1 erreur · 0,2 pt pour 2 erreurs · 0 au-delà</p>
                <div className="flex justify-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{results.filter((r) => r.errors === 0).length} parfait</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span>{results.filter((r) => r.errors === 1 || r.errors === 2).length} partiel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>{results.filter((r) => r.errors > 2).length} incorrect</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 mb-8">
              {questions.map((question, i) => {
                const qResult = results.find((r) => r.questionId === question.id);
                const ua = userAnswers.find((u) => u.questionId === question.id);
                return (
                  <AnnaleCorrectionCard
                    key={question.id}
                    index={i}
                    question={{ ...question, year: (question as any).year ?? (question as any).annale_year ?? null }}
                    answers={answers[question.id] || []}
                    selectedIds={ua?.selectedAnswerIds || []}
                    correctIds={correctAnswersMap[question.id] || []}
                    score={qResult?.score ?? 0}
                    errors={qResult?.errors ?? 0}
                    answerExplanations={(qResult as any)?.answerExplanations}
                  />
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate(backUrl)}>
                Retour aux annales
              </Button>
              <Button onClick={() => navigate("/dashboard/progression")}>Voir ma progression</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[index];
  const currentAnswers = answers[currentQuestion.id] || [];
  const currentUserAnswer = userAnswers.find((ua) => ua.questionId === currentQuestion.id);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => navigate(backUrl)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quitter
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">{courseTitle}</Badge>
              <Badge variant="secondary">
                Question {index + 1} / {questions.length}
              </Badge>
            </div>
          </div>

          <Progress value={((index + 1) / questions.length) * 100} className="mb-8" />

          <Card>
            <CardHeader>
              <p className="text-xs text-muted-foreground">{yearLabel(currentQuestion.year)}</p>
              <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
              <QuestionImage url={currentQuestion.image_url} />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez toutes les réponses correctes
              </p>
              <div className="space-y-3">
                {currentAnswers.map((answer, i) => {
                  const isSelected = currentUserAnswer?.selectedAnswerIds.includes(answer.id);
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={answer.id}
                      onClick={() => toggleAnswer(currentQuestion.id, answer.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                        isSelected ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                      }`}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <span className="font-medium text-muted-foreground">{letter}.</span>
                      <span>{answer.answer_text}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
              </Button>
              {index < questions.length - 1 ? (
                <Button onClick={() => setIndex((i) => i + 1)}>
                  Suivant <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Valider les annales
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {questions.map((_, i) => {
              const hasAnswer = userAnswers[i]?.selectedAnswerIds.length > 0;
              return (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    i === index
                      ? "bg-accent text-accent-foreground"
                      : hasAnswer
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeAnnaleCourseSession;
