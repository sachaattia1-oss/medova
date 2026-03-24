import { useEffect, useState } from "react";
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
import QuestionDiscussion from "@/components/quiz/QuestionDiscussion";

const SERIES_SIZE = 5;

interface Course {
  id: string;
  title: string;
}

interface Question {
  id: string;
  question_text: string;
  explanation: string | null;
  quiz_id: string;
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
}

const TakeSeries = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [stopwatch, setStopwatch] = useState<number>(0);
  
  // Per-question state
  const [isQuestionValidated, setIsQuestionValidated] = useState(false);
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null);
  const [validating, setValidating] = useState(false);
  
  // Series results
  const [seriesResults, setSeriesResults] = useState<QuestionResult[]>([]);
  const [isSeriesComplete, setIsSeriesComplete] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (courseId) {
      fetchSeriesData();
    }
  }, [courseId]);

  // Stopwatch - counts up and resets on each question
  useEffect(() => {
    if (!isSeriesComplete && !isQuestionValidated) {
      const timer = setInterval(() => {
        setStopwatch((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSeriesComplete, isQuestionValidated, currentQuestionIndex]);

  const fetchSeriesData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id")
        .eq("course_id", courseId);

      if (!quizzesData || quizzesData.length === 0) {
        toast.error("Aucun QCM disponible pour ce cours");
        setLoading(false);
        return;
      }

      const quizIds = quizzesData.map(q => q.id);

      const { data: allQuestionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .in("quiz_id", quizIds);

      if (questionsError) throw questionsError;

      if (!allQuestionsData || allQuestionsData.length === 0) {
        toast.error("Aucune question disponible");
        setLoading(false);
        return;
      }

      const shuffled = [...allQuestionsData].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, Math.min(SERIES_SIZE, shuffled.length));
      setQuestions(selectedQuestions);

      setUserAnswers(
        selectedQuestions.map((q) => ({
          questionId: q.id,
          selectedAnswerIds: [],
        }))
      );

      const questionIds = selectedQuestions.map((q) => q.id);
      const { data: answersData, error: answersError } = await supabase
        .from("quiz_answers_public")
        .select("*")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true });

      if (answersError) throw answersError;

      const answersByQuestion: Record<string, Answer[]> = {};
      (answersData || []).forEach((answer: Answer) => {
        if (!answersByQuestion[answer.question_id]) {
          answersByQuestion[answer.question_id] = [];
        }
        answersByQuestion[answer.question_id].push(answer);
      });
      setAnswers(answersByQuestion);

    } catch (error) {
      console.error("Error fetching series data:", error);
      toast.error("Erreur lors du chargement de la série");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (questionId: string, answerId: string) => {
    if (isQuestionValidated) return; // Can't change after validation
    
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

  const validateCurrentQuestion = async () => {
    if (validating) return;
    setValidating(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const currentUserAnswer = userAnswers.find(ua => ua.questionId === currentQuestion.id);

      // Call edge function to validate just this question
      const { data, error } = await supabase.functions.invoke('submit-quiz', {
        body: {
          questionIds: [currentQuestion.id],
          userAnswers: [currentUserAnswer],
          timeSpentSeconds: 0,
          courseId,
          isSeries: true,
        },
      });

      if (error) throw error;

      if (!data.success || !data.results || data.results.length === 0) {
        throw new Error('Erreur lors de la validation');
      }

      const result = data.results[0] as QuestionResult;
      setCurrentResult(result);
      setIsQuestionValidated(true);

    } catch (error) {
      console.error("Error validating question:", error);
      toast.error("Erreur lors de la validation");
    } finally {
      setValidating(false);
    }
  };

  const goToNextQuestion = () => {
    // Save result
    if (currentResult) {
      setSeriesResults(prev => [...prev, currentResult]);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setIsQuestionValidated(false);
      setCurrentResult(null);
      setStopwatch(0);
    } else {
      // Series complete
      setIsSeriesComplete(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreLabel = (score: number) => {
    if (score === 1) return { text: "1 pt", variant: "default" as const, color: "text-green-500" };
    if (score === 0.5) return { text: "0.5 pt", variant: "secondary" as const, color: "text-yellow-500" };
    if (score === 0.2) return { text: "0.2 pt", variant: "secondary" as const, color: "text-orange-500" };
    return { text: "0 pt", variant: "destructive" as const, color: "text-red-500" };
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = currentQuestion ? answers[currentQuestion.id] || [] : [];
  const currentUserAnswer = userAnswers.find(
    (ua) => ua.questionId === currentQuestion?.id
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!course || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Série non disponible</h2>
            <p className="text-muted-foreground mb-4">
              Ce cours ne contient pas assez de QCM pour créer une série.
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
    const allResults = currentResult ? [...seriesResults, currentResult] : seriesResults;
    const totalScore = allResults.reduce((sum, r) => sum + r.score, 0);
    const percentage = (totalScore / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader className="text-center">
                <Trophy className="w-20 h-20 mx-auto text-accent mb-4" />
                <CardTitle className="text-3xl">Série Terminée ! 🎉</CardTitle>
                <p className="text-muted-foreground mt-2">{course.title}</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-6xl font-bold text-accent mb-2">
                  {totalScore.toFixed(1)} / {questions.length}
                </div>
                <p className="text-xl text-muted-foreground mb-6">
                  Score : {percentage.toFixed(0)}%
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{allResults.filter((r) => r.errors === 0).length} parfait</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span>{allResults.filter((r) => r.errors === 1 || r.errors === 2).length} partiel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>{allResults.filter((r) => r.errors > 2).length} incorrect</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recap of all questions */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold">Récapitulatif</h3>
              {questions.map((question, index) => {
                const result = allResults.find((r) => r.questionId === question.id);
                const questionAnswers = answers[question.id] || [];
                const userAnswer = userAnswers.find((ua) => ua.questionId === question.id);
                const scoreInfo = result ? getScoreLabel(result.score) : null;

                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">QCM {index + 1}</Badge>
                        {scoreInfo && (
                          <Badge variant={scoreInfo.variant}>{scoreInfo.text}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base mt-2">{question.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {questionAnswers.map((answer) => {
                          const correctIds = result?.correctAnswerIds || [];
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
              <Button onClick={() => window.location.reload()}>
                Nouvelle série
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
          {/* Series progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {questions.map((_, i) => {
              const result = seriesResults[i];
              const isCurrent = i === currentQuestionIndex;
              const isPast = i < currentQuestionIndex;
              
              return (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    isPast && result
                      ? result.score === 1
                        ? "bg-green-500 text-white"
                        : result.score >= 0.2
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                      : isCurrent
                        ? "bg-accent/20 text-accent border-2 border-accent scale-110"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPast && result ? (
                    result.score === 1 ? <CheckCircle2 className="w-5 h-5" /> : result.score >= 0.2 ? "½" : <XCircle className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
              );
            })}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard/qcm")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quitter
            </Button>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{course.title}</Badge>
              <Badge variant="secondary">
                QCM {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <Badge 
                variant="outline"
                className="flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                {formatTime(stopwatch)}
              </Badge>
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
              {/* Score display above question text */}
              {isQuestionValidated && currentResult && (
                <div className={`mb-3 text-center font-bold text-lg ${
                  currentResult.score === 1 
                    ? "text-green-500" 
                    : currentResult.score >= 0.2 
                      ? "text-yellow-500"
                      : "text-red-500"
                }`}>
                  {currentResult.score === 1 
                    ? "✓ 1 point" 
                    : currentResult.score === 0.5 
                      ? "⚠ 0.5 point (1 erreur)"
                      : currentResult.score === 0.2
                        ? "⚠ 0.2 point (2 erreurs)"
                        : "✗ 0 point (plus de 2 erreurs)"
                  }
                </div>
              )}
              <CardTitle className="text-lg">{currentQuestion?.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isQuestionValidated && (
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez toutes les réponses correctes
                </p>
              )}

              <div className="space-y-3">
                {currentAnswers.map((answer, index) => {
                  const isSelected = currentUserAnswer?.selectedAnswerIds.includes(answer.id);
                  const letter = String.fromCharCode(65 + index);
                  
                  // After validation, show correct/incorrect
                  const isCorrect = isQuestionValidated && currentResult?.correctAnswerIds.includes(answer.id);
                  const isWrong = isQuestionValidated && isSelected && !isCorrect;

                  return (
                    <button
                      key={answer.id}
                      onClick={() => toggleAnswer(currentQuestion.id, answer.id)}
                      disabled={isQuestionValidated}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                        isQuestionValidated
                          ? isCorrect
                            ? "border-green-500 bg-green-500/10"
                            : isWrong
                              ? "border-red-500 bg-red-500/10"
                              : "border-border bg-muted/50"
                          : isSelected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                      }`}
                    >
                      {isQuestionValidated ? (
                        isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : isWrong ? (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5" />
                        )
                      ) : (
                        <Checkbox 
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                      )}
                      <span className="font-medium text-muted-foreground">{letter}.</span>
                      <span>{answer.answer_text}</span>
                      {isWrong && (
                        <span className="text-xs text-red-500 ml-auto">(votre réponse)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after validation */}
              {isQuestionValidated && currentQuestion?.explanation && (
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm">💡 {currentQuestion.explanation}</p>
                </div>
              )}

              {/* Discussion section after validation */}
              {isQuestionValidated && currentQuestion && (
                <QuestionDiscussion quizQuestionId={currentQuestion.id} />
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              {!isQuestionValidated ? (
                <Button onClick={validateCurrentQuestion} disabled={validating}>
                  {validating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Valider ce QCM
                </Button>
              ) : (
                <Button onClick={goToNextQuestion}>
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      QCM suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Voir le résumé
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TakeSeries;
