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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  GripVertical,
  AlertCircle,
  Pencil
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
  is_annale: boolean;
  annale_year: number | null;
}

interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean | null;
  order_index: number | null;
  explanation: string | null;
}

const TutorQuizEditor = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New question form - 5 propositions for medical QCM
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    explanation: "",
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
      is_annale: question.is_annale || false,
      annale_year: question.annale_year || new Date().getFullYear(),
      answers: filledAnswers,
    });
    setIsQuestionDialogOpen(true);
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setNewQuestion({
      question_text: "",
      explanation: "",
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
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasCorrectAnswer = newQuestion.answers.some((a) => a.is_correct);
    if (!hasCorrectAnswer) {
      toast.error("Vous devez sélectionner au moins une bonne réponse");
      return;
    }

    const allFilled = newQuestion.answers.every((a) => a.text.trim());
    if (!allFilled) {
      toast.error("Veuillez remplir les 5 propositions");
      return;
    }

    setSaving(true);

    try {
      if (editingQuestion) {
        // Update existing question
        const { error: updateError } = await supabase
          .from("quiz_questions")
          .update({
            question_text: newQuestion.question_text,
            explanation: newQuestion.explanation || null,
            is_annale: newQuestion.is_annale,
            annale_year: newQuestion.is_annale ? newQuestion.annale_year : null,
          })
          .eq("id", editingQuestion.id);

        if (updateError) throw updateError;

        // Delete old answers and re-insert
        await supabase.from("quiz_answers").delete().eq("question_id", editingQuestion.id);

        const answersToInsert = newQuestion.answers.map((a, index) => ({
          question_id: editingQuestion.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: index,
          explanation: a.explanation || null,
        }));

        const { error: answersError } = await supabase
          .from("quiz_answers")
          .insert(answersToInsert);

        if (answersError) throw answersError;

        toast.success("Question modifiée");
      } else {
        // Create new question
        const { data: questionData, error: questionError } = await supabase
          .from("quiz_questions")
          .insert({
            quiz_id: quizId,
            question_text: newQuestion.question_text,
            explanation: newQuestion.explanation || null,
            order_index: questions.length,
            is_annale: newQuestion.is_annale,
            annale_year: newQuestion.is_annale ? newQuestion.annale_year : null,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        const answersToInsert = newQuestion.answers.map((a, index) => ({
          question_id: questionData.id,
          answer_text: a.text,
          is_correct: a.is_correct,
          order_index: index,
          explanation: a.explanation || null,
        }));

        const { error: answersError } = await supabase
          .from("quiz_answers")
          .insert(answersToInsert);

        if (answersError) throw answersError;

        toast.success("Question ajoutée");
      }

      setIsQuestionDialogOpen(false);
      resetForm();
      fetchQuizData();
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

  // Count correct answers for display
  const correctAnswersCount = newQuestion.answers.filter((a) => a.is_correct).length;

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
      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsQuestionDialogOpen(open);
          }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Modifier la question" : "Nouvelle question QCM médical"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuestion} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="question">Énoncé de la question *</Label>
                <Textarea
                  id="question"
                  value={newQuestion.question_text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question_text: e.target.value })
                  }
                  rows={3}
                  required
                  placeholder="Concernant le métabolisme du glucose, quelle(s) proposition(s) est(sont) exacte(s) ?"
                />
              </div>

              {/* Annale toggle */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 flex-1">
                  <Checkbox
                    id="is_annale"
                    checked={newQuestion.is_annale}
                    onCheckedChange={(checked) =>
                      setNewQuestion({ ...newQuestion, is_annale: !!checked })
                    }
                  />
                  <Label htmlFor="is_annale" className="cursor-pointer text-sm font-medium">
                    📝 C'est une annale
                  </Label>
                </div>
                {newQuestion.is_annale && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Année :</Label>
                    <Input
                      type="number"
                      value={newQuestion.annale_year}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, annale_year: parseInt(e.target.value) || new Date().getFullYear() })
                      }
                      className="w-24"
                      min={2000}
                      max={2099}
                    />
                  </div>
                )}
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
                  <span>
                    Barème médical : 1pt (0 faute), 0.5pt (1 faute), 0.2pt (2 fautes), 0pt (&gt;2 fautes)
                  </span>
                </div>

                {newQuestion.answers.map((answer, index) => {
                  const letter = String.fromCharCode(65 + index); // A, B, C, D, E
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
                <Label htmlFor="explanation">Explication (affichée après validation)</Label>
                <Textarea
                  id="explanation"
                  value={newQuestion.explanation}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, explanation: e.target.value })
                  }
                  rows={2}
                  placeholder="Le glucose est phosphorylé par l'hexokinase en glucose-6-phosphate..."
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
                      {editingQuestion ? "Modification..." : "Ajout..."}
                    </>
                  ) : (
                    editingQuestion ? "Modifier" : "Ajouter"
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
              Aucune question dans ce QCM
            </p>
            <Button onClick={() => setIsQuestionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la première question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const questionAnswers = answers[question.id] || [];
            const correctCount = questionAnswers.filter((a) => a.is_correct).length;

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
                          <Badge variant="secondary" className="text-xs">
                            💡 Explication incluse
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(question)}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
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
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {answer.is_correct && (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="font-medium">{letter}.</span>
                          <span>{answer.answer_text}</span>
                        </div>
                      );
                    })}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-accent/10 rounded-lg">
                      <p className="text-sm">💡 {question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TutorQuizEditor;
