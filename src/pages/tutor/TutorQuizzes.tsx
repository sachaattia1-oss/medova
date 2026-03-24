import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, FileQuestion, Clock, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  category_id: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  time_limit_minutes: number | null;
  is_free: boolean | null;
  order_index: number | null;
  created_by: string | null;
}

const TutorQuizzes = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
    time_limit_minutes: 30,
    is_free: false,
    target_audience: "all",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: catData } = await supabase
        .from("course_categories")
        .select("id, name")
        .order("order_index");

      if (catData) setCategories(catData);

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, category_id")
        .order("title");

      if (coursesData) setCourses(coursesData);

      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (quizzesData) setQuizzes(quizzesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      course_id: selectedCourseId || "",
      time_limit_minutes: 30,
      is_free: false,
      target_audience: "all",
    });
    setEditingQuiz(null);
  };

  const handleOpenDialog = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setFormData({
        title: quiz.title,
        description: quiz.description || "",
        course_id: quiz.course_id || "",
        time_limit_minutes: quiz.time_limit_minutes || 30,
        is_free: quiz.is_free || false,
        target_audience: (quiz as any).target_audience || "all",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course_id) {
      toast.error("Veuillez sélectionner un cours");
      return;
    }

    setSaving(true);

    try {
      const quizData = {
        title: formData.title,
        description: formData.description || null,
        course_id: formData.course_id,
        time_limit_minutes: formData.time_limit_minutes,
        is_free: formData.is_free,
        target_audience: formData.target_audience,
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

      await fetchData();
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

  // Filter courses by selected category
  const filteredCourses = selectedCategoryId
    ? courses.filter((c) => c.category_id === selectedCategoryId)
    : [];

  // Filter quizzes by selected course
  const filteredQuizzes = selectedCourseId
    ? quizzes.filter((q) => q.course_id === selectedCourseId)
    : [];

  // Get category/course names
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Count quizzes per category
  const getQuizCountForCategory = (categoryId: string) => {
    const coursesInCategory = courses.filter((c) => c.category_id === categoryId);
    const courseIds = coursesInCategory.map((c) => c.id);
    return quizzes.filter((q) => q.course_id && courseIds.includes(q.course_id)).length;
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
          <h1 className="text-2xl font-bold">QCM</h1>
          <p className="text-muted-foreground">
            Créez des QCM pour évaluer vos étudiants
          </p>
        </div>
        {selectedCourseId && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau QCM
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingQuiz ? "Modifier le QCM" : "Nouveau QCM"}
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
                  <Label>Cours associé</Label>
                  <Select
                    value={formData.course_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, course_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="is_free">QCM gratuit</Label>
                </div>

                <div className="space-y-2">
                  <Label>Public cible</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, target_audience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le public" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les étudiants</SelectItem>
                      <SelectItem value="terminale">Terminale uniquement</SelectItem>
                      <SelectItem value="pass">PASS uniquement</SelectItem>
                    </SelectContent>
                  </Select>
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
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedCategoryId || selectedCourseId) && (
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button 
            onClick={() => { setSelectedCategoryId(null); setSelectedCourseId(null); }}
            className="text-accent hover:underline"
          >
            Matières
          </button>
          {selectedCategory && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button 
                onClick={() => setSelectedCourseId(null)}
                className={selectedCourseId ? "text-accent hover:underline" : "text-foreground"}
              >
                {selectedCategory.name}
              </button>
            </>
          )}
          {selectedCourse && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{selectedCourse.title}</span>
            </>
          )}
        </div>
      )}

      {/* Content based on selection */}
      {!selectedCategoryId ? (
        // Show categories
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length > 0 ? categories.map((category) => {
            const quizCount = getQuizCountForCategory(category.id);
            const courseCount = courses.filter((c) => c.category_id === category.id).length;

            return (
              <Card 
                key={category.id}
                className="cursor-pointer hover:border-accent/50 transition-colors"
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {courseCount} cours · {quizCount} QCM
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          }) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune catégorie</h3>
                <p className="text-muted-foreground text-center">
                  Créez d'abord des catégories de cours.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : !selectedCourseId ? (
        // Show courses in selected category
        <div className="space-y-4">
          {filteredCourses.length > 0 ? filteredCourses.map((course) => {
            const courseQuizCount = quizzes.filter((q) => q.course_id === course.id).length;

            return (
              <Card 
                key={course.id}
                className="cursor-pointer hover:border-accent/50 transition-colors"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {courseQuizCount} QCM
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          }) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun cours</h3>
                <p className="text-muted-foreground text-center">
                  Créez d'abord des cours dans cette catégorie.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Show quizzes for selected course
        <>
          {filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun QCM</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Créez votre premier QCM pour ce cours
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un QCM
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{quiz.title}</h3>
                          {quiz.is_free && (
                            <Badge variant="secondary">Gratuit</Badge>
                          )}
                        </div>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {quiz.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{quiz.time_limit_minutes || 30} min</span>
                        </div>
                      </div>
                    </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TutorQuizzes;
