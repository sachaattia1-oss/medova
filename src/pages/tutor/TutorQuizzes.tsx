import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, FileQuestion, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  time_limit_minutes: number | null;
  is_free: boolean | null;
  order_index: number | null;
}

const TutorQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    time_limit_minutes: 30,
    is_free: false,
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Erreur lors du chargement des quiz");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      time_limit_minutes: 30,
      is_free: false,
    });
    setEditingQuiz(null);
  };

  const handleOpenDialog = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setFormData({
        title: quiz.title,
        description: quiz.description || "",
        category: quiz.category || "",
        time_limit_minutes: quiz.time_limit_minutes || 30,
        is_free: quiz.is_free || false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const quizData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        time_limit_minutes: formData.time_limit_minutes,
        is_free: formData.is_free,
      };

      if (editingQuiz) {
        const { error } = await supabase
          .from("quizzes")
          .update(quizData)
          .eq("id", editingQuiz.id);

        if (error) throw error;
        toast.success("Quiz mis à jour");
      } else {
        const { error } = await supabase.from("quizzes").insert(quizData);

        if (error) throw error;
        toast.success("Quiz créé");
      }

      await fetchQuizzes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) return;

    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;

      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      toast.success("Quiz supprimé");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

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
          <h1 className="text-2xl font-bold">Mes quiz</h1>
          <p className="text-muted-foreground">
            Créez des quiz pour évaluer vos étudiants
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingQuiz ? "Modifier le quiz" : "Nouveau quiz"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: UE1, Anatomie, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_limit">Temps limite (minutes)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  min={1}
                  max={180}
                  value={formData.time_limit_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time_limit_minutes: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) =>
                    setFormData({ ...formData, is_free: e.target.checked })
                  }
                  className="rounded border-border"
                />
                <Label htmlFor="is_free">Quiz gratuit</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : editingQuiz ? (
                    "Mettre à jour"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun quiz créé</h3>
            <p className="text-muted-foreground text-center mb-4">
              Créez votre premier quiz pour évaluer vos étudiants
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Temps</TableHead>
                <TableHead>Gratuit</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {quiz.category ? (
                      <Badge variant="secondary">{quiz.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.time_limit_minutes} min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {quiz.is_free ? (
                      <Badge variant="secondary">Oui</Badge>
                    ) : (
                      <span className="text-muted-foreground">Non</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(quiz)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quiz.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/tutor/quiz/${quiz.id}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TutorQuizzes;
