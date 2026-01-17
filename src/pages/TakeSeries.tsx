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
  is_correct: boolean;
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
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 min par série
  const [startTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, string[]>>({});

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

  // Timer
  useEffect(() => {
    if (!isSubmitted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted]);

  const fetchSeriesData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch all quizzes for this course
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

      // Fetch all questions from these quizzes
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

      // Shuffle and pick SERIES_SIZE random questions
      const shuffled = [...allQuestionsData].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, Math.min(SERIES_SIZE, shuffled.length));
      setQuestions(selectedQuestions);

      // Initialize user answers
      setUserAnswers(
        selectedQuestions.map((q) => ({
          questionId: q.id,
          selectedAnswerIds: [],
        }))
      );

      // Fetch answers for selected questions (from public view - no is_correct)
      const questionIds = selectedQuestions.map((q) => q.id);
      const { data: answersData, error: answersError } = await supabase
        .from("quiz_answers_public")
        .select("*")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true });

      if (answersError) throw answersError;

      // Group answers by question
      const answersByQuestion: Record<string, Answer[]> = {};
      (answersData || []).forEach((answer: any) => {
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
      
      // Call edge function to validate
      const { data, error } = await supabase.functions.invoke('submit-quiz', {
        body: {
          questionIds: questions.map(q => q.id),
          userAnswers,
          timeSpentSeconds: timeSpent,
          courseId,
          isSeries: true,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error('Erreur lors de la validation');
      }

      setResults(data.results);
      setTotalScore(data.totalScore);
      
      // Build correct answers map
      const correctMap: Record<string, string[]> = {};
      data.results.forEach((r: QuestionResult & { correctAnswerIds: string[] }) => {
        correctMap[r.questionId] = r.correctAnswerIds;
      });
      setCorrectAnswersMap(correctMap);
      
      setIsSubmitted(true);
      toast.success("Série terminée !");
    } catch (error) {
      console.error("Error submitting series:", error);
      toast.error("Erreur lors de la validation");
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

  // Results view
  if (isSubmitted) {
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
                        <Badge variant="secondary">QCM {index + 1}</Badge>
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
                Retour aux QCM
              </Button>
              <Button onClick={() => navigate(`/dashboard/qcm/series/${courseId}`)}>
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
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  i < currentQuestionIndex
                    ? "bg-accent text-accent-foreground"
                    : i === currentQuestionIndex
                      ? "bg-accent/20 text-accent border-2 border-accent scale-110"
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
              <Badge variant="outline">{course.title}</Badge>
              <Badge variant="secondary">
                QCM {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <Badge 
                variant={timeLeft < 60 ? "destructive" : "outline"}
                className="flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                {formatTime(timeLeft)}
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
              <CardTitle className="text-lg">{currentQuestion?.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez toutes les réponses correctes
              </p>
              <div className="space-y-3">
                {currentAnswers.map((answer, index) => {
                  const isSelected = currentUserAnswer?.selectedAnswerIds.includes(answer.id);
                  const letter = String.fromCharCode(65 + index);

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
                <Button onClick={() => setCurrentQuestionIndex((i) => i + 1)}>
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
                  Valider la série
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

export default TakeSeries;
