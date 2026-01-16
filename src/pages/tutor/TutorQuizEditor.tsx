import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Circle,
  GripVertical 
} from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
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
}

const TutorQuizEditor = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New question form
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    explanation: "",
    answers: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("id, title, description")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

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
      toast.error("Erreur lors du chargement du quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create question
      const { data: questionData, error: questionError } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          question_text: newQuestion.question_text,
          explanation: newQuestion.explanation || null,
          order_index: questions.length,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Create answers
      const answersToInsert = newQuestion.answers
        .filter((a) => a.text.trim())
        .map((a, index) => ({
          question_id: questionData.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: index,
        }));

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from("quiz_answers")
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      toast.success("Question ajoutée");
      setIsQuestionDialogOpen(false);
      setNewQuestion({
        question_text: "",
        explanation: "",
        answers: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      });
      fetchQuizData();
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Erreur lors de l'ajout de la question");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Supprimer cette question ?")) return;

    try {
      // Delete answers first
      await supabase.from("quiz_answers").delete().eq("question_id", questionId);

      // Delete question
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      toast.success("Question supprimée");
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const updateAnswerText = (index: number, text: string) => {
    const updated = [...newQuestion.answers];
    updated[index].text = text;
    setNewQuestion({ ...newQuestion, answers: updated });
  };

  const setCorrectAnswer = (index: number) => {
    const updated = newQuestion.answers.map((a, i) => ({
      ...a,
      is_correct: i === index,
    }));
    setNewQuestion({ ...newQuestion, answers: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quiz introuvable</p>
        <Button variant="outline" onClick={() => navigate("/tutor/quiz")} className="mt-4">
          Retour aux quiz
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/tutor/quiz")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </div>
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nouvelle question</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuestion} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  value={newQuestion.question_text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question_text: e.target.value })
                  }
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Réponses (cliquez pour marquer la bonne réponse)</Label>
                {newQuestion.answers.map((answer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(index)}
                      className="flex-shrink-0"
                    >
                      {answer.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <Input
                      value={answer.text}
                      onChange={(e) => updateAnswerText(index, e.target.value)}
                      placeholder={`Réponse ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explication (optionnel)</Label>
                <Textarea
                  id="explanation"
                  value={newQuestion.explanation}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, explanation: e.target.value })
                  }
                  rows={2}
                  placeholder="Explication affichée après la réponse"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionDialogOpen(false)}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions list */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucune question dans ce quiz
            </p>
            <Button onClick={() => setIsQuestionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la première question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
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
                    {question.explanation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        💡 {question.explanation}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(answers[question.id] || []).map((answer) => (
                    <div
                      key={answer.id}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        answer.is_correct
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {answer.is_correct && (
                        <CheckCircle2 className="w-4 h-4 inline mr-2" />
                      )}
                      {answer.answer_text}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorQuizEditor;
