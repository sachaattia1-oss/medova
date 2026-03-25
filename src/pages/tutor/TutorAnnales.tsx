import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const TutorAnnales = () => {
  const { user } = useAuth();
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [categoryId, setCategoryId] = useState("");
  const [quizId, setQuizId] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [{ data: annalesData }, { data: catData }, { data: quizData }] = await Promise.all([
        supabase.from("annales").select("*").order("year", { ascending: false }),
        supabase.from("course_categories").select("id, name").order("order_index"),
        supabase.from("quizzes").select("id, title").order("title"),
      ]);
      setAnnales(annalesData || []);
      setCategories(catData || []);
      setQuizzes(quizData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !year || !quizId) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("annales").insert({
        title: title.trim(),
        year: parseInt(year),
        category_id: categoryId || null,
        quiz_id: quizId,
        target_audience: targetAudience,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Annale ajoutée avec succès");
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
    setQuizId("");
    setTargetAudience("all");
  };

  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "—";

  const getQuizTitle = (id: string | null) =>
    quizzes.find((q) => q.id === id)?.title || "—";

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Annales</h2>
          <p className="text-muted-foreground">Créez des annales d'examens sous forme de QCM. Commencez par créer un quiz dans "Mes quiz", puis associez-le ici comme annale.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une annale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle annale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Titre *</Label>
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

              <div>
                <Label>QCM associé *</Label>
                <Select value={quizId} onValueChange={setQuizId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un quiz" /></SelectTrigger>
                  <SelectContent>
                    {quizzes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Créez d'abord le quiz dans "Mes quiz", puis associez-le ici.
                </p>
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={submitting || !title.trim() || !quizId}>
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
          <p className="text-sm text-muted-foreground">Créez un quiz puis ajoutez-le comme annale</p>
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
