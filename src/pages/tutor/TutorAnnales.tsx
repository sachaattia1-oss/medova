import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { FileText, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Annale {
  id: string;
  title: string;
  year: number;
  category_id: string | null;
  quiz_id: string | null;
  target_audience: string;
  created_by: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface Quiz {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
}

const TutorAnnales = () => {
  const { user } = useAuth();
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [categoryId, setCategoryId] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");

  // Quiz mode: "existing" or "new"
  const [quizMode, setQuizMode] = useState<"existing" | "new">("existing");
  const [quizId, setQuizId] = useState("");

  // New quiz form
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizDescription, setNewQuizDescription] = useState("");
  const [newQuizCourseId, setNewQuizCourseId] = useState("");
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState(30);
  const [newQuizIsFree, setNewQuizIsFree] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [{ data: annalesData }, { data: catData }, { data: quizData }, { data: coursesData }] = await Promise.all([
        supabase.from("annales").select("*").order("year", { ascending: false }),
        supabase.from("course_categories").select("id, name").order("order_index"),
        supabase.from("quizzes").select("id, title").order("title"),
        supabase.from("courses").select("id, title").order("title"),
      ]);
      setAnnales(annalesData || []);
      setCategories(catData || []);
      setQuizzes(quizData || []);
      setCourses(coursesData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !year) return;

    if (quizMode === "existing" && !quizId) {
      toast.error("Veuillez sélectionner un quiz");
      return;
    }
    if (quizMode === "new" && !newQuizTitle.trim()) {
      toast.error("Veuillez entrer un titre pour le quiz");
      return;
    }

    setSubmitting(true);

    try {
      let finalQuizId = quizId;

      // Create new quiz if needed
      if (quizMode === "new") {
        const { data: newQuiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            title: newQuizTitle.trim(),
            description: newQuizDescription || null,
            course_id: newQuizCourseId || null,
            time_limit_minutes: newQuizTimeLimit,
            is_free: newQuizIsFree,
            target_audience: targetAudience,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (quizError) throw quizError;
        finalQuizId = newQuiz.id;
      }

      const { error } = await supabase.from("annales").insert({
        title: title.trim(),
        year: parseInt(year),
        category_id: categoryId || null,
        quiz_id: finalQuizId,
        target_audience: targetAudience,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Annale ajoutée avec succès");
      if (quizMode === "new") {
        toast.info("N'oubliez pas d'ajouter les questions au quiz dans \"Mes quiz\"");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("annales").delete().eq("id", id);
      if (error) throw error;
      toast.success("Annale supprimée");
      setAnnales((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  const resetForm = () => {
    setTitle("");
    setYear(new Date().getFullYear().toString());
    setCategoryId("");
    setTargetAudience("all");
    setQuizMode("existing");
    setQuizId("");
    setNewQuizTitle("");
    setNewQuizDescription("");
    setNewQuizCourseId("");
    setNewQuizTimeLimit(30);
    setNewQuizIsFree(false);
  };

  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "—";

  const getQuizTitle = (id: string | null) =>
    quizzes.find((q) => q.id === id)?.title || "—";

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const canSubmit = title.trim() && year && (
    (quizMode === "existing" && quizId) ||
    (quizMode === "new" && newQuizTitle.trim())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Annales</h2>
          <p className="text-muted-foreground">Gérez les annales d'examens sous forme de QCM</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une annale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle annale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Annale info */}
              <div>
                <Label>Titre de l'annale *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Annale PASS 2024 - UE1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Année *</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Public cible</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="pass">PASS</SelectItem>
                      <SelectItem value="terminale">Terminale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Matière</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une matière" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quiz mode toggle */}
              <div className="border-t border-border pt-4">
                <Label className="text-base font-semibold mb-3 block">QCM associé *</Label>
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={quizMode === "existing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuizMode("existing")}
                  >
                    Quiz existant
                  </Button>
                  <Button
                    type="button"
                    variant={quizMode === "new" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuizMode("new")}
                  >
                    Créer un nouveau quiz
                  </Button>
                </div>

                {quizMode === "existing" ? (
                  <div>
                    <Select value={quizId} onValueChange={setQuizId}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un quiz" /></SelectTrigger>
                      <SelectContent>
                        {quizzes.map((q) => (
                          <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <Label>Titre du quiz *</Label>
                      <Input
                        value={newQuizTitle}
                        onChange={(e) => setNewQuizTitle(e.target.value)}
                        placeholder="Ex: QCM Annale UE1 2024"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newQuizDescription}
                        onChange={(e) => setNewQuizDescription(e.target.value)}
                        placeholder="Description du quiz (optionnel)"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Cours associé (optionnel)</Label>
                      <Select value={newQuizCourseId} onValueChange={setNewQuizCourseId}>
                        <SelectTrigger><SelectValue placeholder="Aucun cours" /></SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Temps limite (min)</Label>
                        <Input
                          type="number"
                          value={newQuizTimeLimit}
                          onChange={(e) => setNewQuizTimeLimit(parseInt(e.target.value) || 30)}
                          min={1}
                        />
                      </div>
                      <div className="flex items-end gap-2 pb-1">
                        <Switch
                          checked={newQuizIsFree}
                          onCheckedChange={setNewQuizIsFree}
                        />
                        <Label>Gratuit</Label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le quiz sera créé automatiquement. Vous pourrez y ajouter les questions ensuite dans "Mes quiz".
                    </p>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={submitting || !canSubmit}>
                {submitting ? "Ajout en cours..." : "Ajouter l'annale"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
        </div>
      ) : annales.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Aucune annale</h3>
          <p className="text-sm text-muted-foreground">Ajoutez une annale avec un quiz existant ou créez-en un nouveau</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>QCM</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annales.map((annale) => (
                  <TableRow key={annale.id}>
                    <TableCell className="font-medium">{annale.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {annale.year}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCategoryName(annale.category_id)}</TableCell>
                    <TableCell>
                      <Badge variant={annale.target_audience === "pass" ? "default" : annale.target_audience === "terminale" ? "secondary" : "outline"}>
                        {annale.target_audience === "pass" ? "PASS" : annale.target_audience === "terminale" ? "Terminale" : "Tous"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getQuizTitle(annale.quiz_id)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(annale.created_at), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {annale.created_by === user?.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(annale.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorAnnales;
