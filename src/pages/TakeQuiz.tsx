import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Clock, 
  Loader2, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
}

interface Question {
  id: string;
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
}

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
}

interface QuestionResult {
  questionId: string;
  score: number;
  isCorrect: boolean;
  errors: number;
}

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (quiz?.time_limit_minutes && !isSubmitted && timeLeft !== null) {
      if (timeLeft <= 0) {
        handleSubmit();
        return;
      }

      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted, quiz]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("id, title, description, time_limit_minutes")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);
      setTimeLeft((quizData.time_limit_minutes || 30) * 60);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Initialize user answers
      setUserAnswers(
        (questionsData || []).map((q) => ({
          questionId: q.id,
          selectedAnswerIds: [],
        }))
      );

      // Fetch answers for all questions
      if (questionsData && questionsData.length > 0) {
        const questionIds = questionsData.map((q) => q.id);
        const { data: answersData, error: answersError } = await supabase
          .from("quiz_answers")
          .select("*")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });

        if (answersError) throw answersError;

        // Group answers by question
        const answersByQuestion: Record<string, Answer[]> = {};
        (answersData || []).forEach((answer) => {
          if (!answersByQuestion[answer.question_id]) {
            answersByQuestion[answer.question_id] = [];
          }
          answersByQuestion[answer.question_id].push(answer);
        });
        setAnswers(answersByQuestion);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Erreur lors du chargement du QCM");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (questionId: string, answerId: string) => {
    setUserAnswers((prev) =>
      prev.map((ua) => {
        if (ua.questionId === questionId) {
          const isSelected = ua.selectedAnswerIds.includes(answerId);
          return {
            ...ua,
            selectedAnswerIds: isSelected
              ? ua.selectedAnswerIds.filter((id) => id !== answerId)
              : [...ua.selectedAnswerIds, answerId],
          };
        }
        return ua;
      })
    );
  };

  const calculateScore = useCallback(() => {
    const questionResults: QuestionResult[] = [];
    let total = 0;

    questions.forEach((question) => {
      const userAnswer = userAnswers.find((ua) => ua.questionId === question.id);
      const questionAnswers = answers[question.id] || [];
      
      // Get correct answer IDs
      const correctAnswerIds = questionAnswers
        .filter((a) => a.is_correct)
        .map((a) => a.id);
      
      // Get user selected answer IDs
      const selectedIds = userAnswer?.selectedAnswerIds || [];

      // Calculate errors:
      // - Missing correct answers
      // - Extra incorrect answers
      const missingCorrect = correctAnswerIds.filter((id) => !selectedIds.includes(id)).length;
      const extraIncorrect = selectedIds.filter((id) => !correctAnswerIds.includes(id)).length;
      const errors = missingCorrect + extraIncorrect;

      // Medical scoring:
      // 0 errors = 1 point
      // 1 error = 0.5 points
      // 2 errors = 0.2 points
      // 3+ errors = 0 points
      let score = 0;
      if (errors === 0) {
        score = 1;
      } else if (errors === 1) {
        score = 0.5;
      } else if (errors === 2) {
        score = 0.2;
      }

      total += score;
      questionResults.push({
        questionId: question.id,
        score,
        isCorrect: errors === 0,
        errors,
      });
    });

    return { results: questionResults, total };
  }, [questions, userAnswers, answers]);

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);

    const { results: questionResults, total } = calculateScore();
    setResults(questionResults);
    setTotalScore(total);
    setIsSubmitted(true);

    // Save attempt to database
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      if (user?.id && quizId) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          quiz_id: quizId,
          score: total,
          total_questions: questions.length,
          time_spent_seconds: timeSpent,
          completed_at: new Date().toISOString(),
          answers_data: userAnswers as unknown as Record<string, unknown>,
        });
      }

      toast.success("QCM terminé !");
    } catch (error) {
      console.error("Error saving attempt:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = currentQuestion ? answers[currentQuestion.id] || [] : [];
  const currentUserAnswer = userAnswers.find(
    (ua) => ua.questionId === currentQuestion?.id
  );
  const currentResult = results.find((r) => r.questionId === currentQuestion?.id);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">QCM non disponible</h2>
            <p className="text-muted-foreground mb-4">
              Ce QCM n'existe pas ou ne contient pas de questions.
            </p>
            <Button onClick={() => navigate("/dashboard/qcm")}>
              Retour aux QCM
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Results view
  if (isSubmitted) {
    const percentage = (totalScore / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Summary Card */}
            <Card className="mb-8">
              <CardHeader className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-accent mb-4" />
                <CardTitle className="text-2xl">QCM Terminé !</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-5xl font-bold text-accent mb-2">
                  {totalScore.toFixed(1)} / {questions.length}
                </div>
                <p className="text-muted-foreground mb-4">
                  Score: {percentage.toFixed(0)}%
                </p>
                <div className="flex justify-center gap-4 text-sm">
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

            {/* Question Review */}
            <div className="space-y-4 mb-8">
              {questions.map((question, index) => {
                const questionResult = results.find((r) => r.questionId === question.id);
                const questionAnswers = answers[question.id] || [];
                const userAnswer = userAnswers.find((ua) => ua.questionId === question.id);

                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Question {index + 1}</Badge>
                        <Badge 
                          variant={
                            questionResult?.errors === 0 
                              ? "default" 
                              : questionResult?.errors && questionResult.errors <= 2 
                                ? "secondary" 
                                : "destructive"
                          }
                        >
                          {questionResult?.score.toFixed(1)} pt
                        </Badge>
                      </div>
                      <CardTitle className="text-base mt-2">{question.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {questionAnswers.map((answer) => {
                          const isCorrect = answer.is_correct;
                          const isSelected = userAnswer?.selectedAnswerIds.includes(answer.id);

                          return (
                            <div
                              key={answer.id}
                              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                isCorrect
                                  ? "bg-green-500/10 border border-green-500/30"
                                  : isSelected
                                    ? "bg-red-500/10 border border-red-500/30"
                                    : "bg-muted"
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : isSelected ? (
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4" />
                              )}
                              <span>{answer.answer_text}</span>
                              {isSelected && !isCorrect && (
                                <span className="text-xs text-red-500 ml-auto">(votre réponse)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {question.explanation && (
                        <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                          <p className="text-sm">💡 {question.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard/qcm")}>
                Retour aux QCM
              </Button>
              <Button onClick={() => navigate("/dashboard/progression")}>
                Voir ma progression
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard/qcm")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quitter
            </Button>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              {timeLeft !== null && (
                <Badge 
                  variant={timeLeft < 60 ? "destructive" : "outline"}
                  className="flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  {formatTime(timeLeft)}
                </Badge>
              )}
            </div>
          </div>

          {/* Progress */}
          <Progress 
            value={((currentQuestionIndex + 1) / questions.length) * 100} 
            className="mb-8"
          />

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion?.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez toutes les réponses correctes (5 propositions)
              </p>
              <div className="space-y-3">
                {currentAnswers.map((answer, index) => {
                  const isSelected = currentUserAnswer?.selectedAnswerIds.includes(answer.id);
                  const letter = String.fromCharCode(65 + index); // A, B, C, D, E

                  return (
                    <button
                      key={answer.id}
                      onClick={() => toggleAnswer(currentQuestion.id, answer.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <Checkbox 
                        checked={isSelected}
                        className="pointer-events-none"
                      />
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
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Valider le QCM
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Question navigation dots */}
          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {questions.map((_, index) => {
              const hasAnswer = userAnswers[index]?.selectedAnswerIds.length > 0;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? "bg-accent text-accent-foreground"
                      : hasAnswer
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;