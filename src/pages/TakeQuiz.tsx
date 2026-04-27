import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  Trophy,
  Play
} from "lucide-react";
import { toast } from "sonner";

const SERIES_SIZE = 5;

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  course_id: string | null;
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

interface SubmitResponse {
  success: boolean;
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  results: QuestionResult[];
}

interface SeriesResult {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
}

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Series tracking from URL params
  const seriesIndex = parseInt(searchParams.get("series") || "1");
  const seriesDataParam = searchParams.get("seriesData");
  const seriesResults: SeriesResult[] = seriesDataParam ? JSON.parse(decodeURIComponent(seriesDataParam)) : [];
  const completedQuizIds = searchParams.get("completed")?.split(",").filter(Boolean) || [];

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, string[]>>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const [nextQuizId, setNextQuizId] = useState<string | null>(null);
  const [isSeriesComplete, setIsSeriesComplete] = useState(false);
  const [finalSeriesResults, setFinalSeriesResults] = useState<SeriesResult[]>([]);

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
        .select("id, title, description, time_limit_minutes, course_id")
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

      // Fetch answers from secure view (no is_correct field)
      if (questionsData && questionsData.length > 0) {
        const questionIds = questionsData.map((q) => q.id);
        const { data: answersData, error: answersError } = await supabase
          .from("quiz_answers_public")
          .select("*")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });

        if (answersError) throw answersError;

        // Group answers by question
        const answersByQuestion: Record<string, Answer[]> = {};
        (answersData || []).forEach((answer: Answer) => {
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

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Call edge function to validate and save quiz attempt
      const { data, error } = await supabase.functions.invoke('submit-quiz', {
        body: {
          quizId,
          userAnswers,
          timeSpentSeconds: timeSpent,
        },
      });

      if (error) throw error;

      const response = data as SubmitResponse;
      
      if (!response.success) {
        throw new Error('Erreur lors de la validation');
      }

      // Store results from server
      setResults(response.results);
      setTotalScore(response.totalScore);
      
      // Build correct answers map for display
      const correctMap: Record<string, string[]> = {};
      response.results.forEach((r) => {
        correctMap[r.questionId] = r.correctAnswerIds;
      });
      setCorrectAnswersMap(correctMap);
      
      setIsSubmitted(true);
      toast.success(`QCM ${seriesIndex}/${SERIES_SIZE} terminé !`);

      // Handle series logic
      const newResult: SeriesResult = {
        quizId: quizId!,
        quizTitle: quiz?.title || "",
        score: response.totalScore,
        totalQuestions: response.totalQuestions,
      };
      const updatedResults = [...seriesResults, newResult];
      const updatedCompleted = [...completedQuizIds, quizId!];

      if (seriesIndex >= SERIES_SIZE) {
        // Series complete - show final summary
        setFinalSeriesResults(updatedResults);
        setIsSeriesComplete(true);
      } else {
        // Fetch next quiz and start countdown
        await fetchAndStartNextQuiz(quiz?.course_id, updatedCompleted, updatedResults);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Erreur lors de la validation du QCM");
    } finally {
      setSaving(false);
    }
  };

  const fetchAndStartNextQuiz = async (
    courseId: string | null | undefined, 
    completedIds: string[],
    currentResults: SeriesResult[]
  ) => {
    if (!courseId) return;

    try {
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("course_id", courseId);

      if (quizzesData && quizzesData.length > 0) {
        // Filter out completed quizzes
        let availableQuizzes = quizzesData.filter(q => !completedIds.includes(q.id));
        
        // If all quizzes done, allow repeats
        if (availableQuizzes.length === 0) {
          availableQuizzes = quizzesData;
        }

        const randomIndex = Math.floor(Math.random() * availableQuizzes.length);
        const nextQuiz = availableQuizzes[randomIndex];
        setNextQuizId(nextQuiz.id);

        // Start 3 second countdown then auto-navigate
        setCountdown(3);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              // Navigate to next quiz with series data
              const seriesData = encodeURIComponent(JSON.stringify(currentResults));
              const completed = completedIds.join(",");
              navigate(`/dashboard/qcm/${nextQuiz.id}?series=${seriesIndex + 1}&seriesData=${seriesData}&completed=${completed}`);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching next quiz:", error);
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
        <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
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

  // Final series summary
  if (isSeriesComplete) {
    const totalSeriesScore = finalSeriesResults.reduce((sum, r) => sum + r.score, 0);
    const totalSeriesQuestions = finalSeriesResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const seriesPercentage = totalSeriesQuestions > 0 ? (totalSeriesScore / totalSeriesQuestions) * 100 : 0;

    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader className="text-center">
                <Trophy className="w-20 h-20 mx-auto text-accent mb-4" />
                <CardTitle className="text-3xl">Série de {SERIES_SIZE} QCM Terminée ! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-6xl font-bold text-accent mb-2">
                  {totalSeriesScore.toFixed(1)} / {totalSeriesQuestions}
                </div>
                <p className="text-xl text-muted-foreground mb-6">
                  Score global : {seriesPercentage.toFixed(0)}%
                </p>
                
                {/* Individual quiz results */}
                <div className="space-y-3 mt-8">
                  <h3 className="text-lg font-semibold mb-4">Détail par QCM</h3>
                  {finalSeriesResults.map((result, index) => (
                    <div 
                      key={result.quizId} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="font-medium">{result.quizTitle}</span>
                      </div>
                      <Badge variant={result.score / result.totalQuestions >= 0.6 ? "default" : "destructive"}>
                        {result.score.toFixed(1)} / {result.totalQuestions}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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

  // Results view with countdown to next quiz
  if (isSubmitted) {
    const percentage = (totalScore / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {Array.from({ length: SERIES_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    i < seriesIndex
                      ? "bg-accent text-accent-foreground"
                      : i === seriesIndex
                        ? "bg-accent/20 text-accent border-2 border-accent"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Summary Card */}
            <Card className="mb-8">
              <CardHeader className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-accent mb-4" />
                <CardTitle className="text-2xl">QCM {seriesIndex}/{SERIES_SIZE} Terminé !</CardTitle>
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

                {/* Countdown to next quiz */}
                {countdown !== null && seriesIndex < SERIES_SIZE && (
                  <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/30">
                    <p className="text-lg font-medium">
                      Prochain QCM dans <span className="text-2xl font-bold text-accent">{countdown}</span> seconde{countdown > 1 ? "s" : ""}...
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className="text-sm text-muted-foreground">Préparation du QCM suivant</span>
                    </div>
                  </div>
                )}
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
                          const correctIds = correctAnswersMap[question.id] || [];
                          const isCorrect = correctIds.includes(answer.id);
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
                Quitter la série
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
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Series progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: SERIES_SIZE }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < seriesIndex - 1
                    ? "bg-accent text-accent-foreground"
                    : i === seriesIndex - 1
                      ? "bg-accent/20 text-accent border-2 border-accent"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard/qcm")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quitter
            </Button>
            <div className="flex items-center gap-4">
              <Badge variant="outline">QCM {seriesIndex}/{SERIES_SIZE}</Badge>
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