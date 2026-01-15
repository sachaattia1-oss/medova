import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  is_free: boolean | null;
  pdf_url: string | null;
  order_index: number | null;
}

interface Category {
  id: string;
  name: string;
  order_index: number | null;
}

const AdminCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    pdf_url: "",
    is_free: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) return;

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast.error("Accès refusé");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);

      // Fetch categories
      const { data: catData } = await supabase
        .from("course_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (catData) setCategories(catData);

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (coursesData) setCourses(coursesData);
      setLoading(false);
    };

    checkAdminAndFetch();
  }, [user, navigate]);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Non classé";
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "Non classé";
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category_id: "",
      pdf_url: "",
      is_free: false,
    });
    setEditingCourse(null);
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || "",
        category_id: course.category_id || "",
        pdf_url: course.pdf_url || "",
        is_free: course.is_free || false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const courseData = {
      title: formData.title,
      description: formData.description || null,
      category_id: formData.category_id || null,
      pdf_url: formData.pdf_url || null,
      is_free: formData.is_free,
    };

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", editingCourse.id);

        if (error) throw error;
        toast.success("Cours mis à jour");
      } else {
        const { error } = await supabase.from("courses").insert(courseData);

        if (error) throw error;
        toast.success("Cours créé");
      }

      // Refresh courses
      const { data } = await supabase
        .from("courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (data) setCourses(data);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      setCourses(courses.filter((c) => c.id !== courseId));
      toast.success("Cours supprimé");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <DashboardHeader
            title="Gestion des cours"
            description="Ajouter et organiser les cours par catégorie"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau cours
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? "Modifier le cours" : "Nouveau cours"}
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
                  <Label htmlFor="category">Catégorie (UE)</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
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
                  <Label htmlFor="pdf_url">URL du PDF</Label>
                  <Input
                    id="pdf_url"
                    value={formData.pdf_url}
                    onChange={(e) =>
                      setFormData({ ...formData, pdf_url: e.target.value })
                    }
                    placeholder="/course-pdfs/mon-cours.pdf"
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
                  <Label htmlFor="is_free">Cours gratuit</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCourse ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Courses by Category */}
        {categories.map((category) => {
          const categoryCourses = courses.filter(
            (c) => c.category_id === category.id
          );
          return (
            <div key={category.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <Badge variant="secondary">{categoryCourses.length} cours</Badge>
              </div>
              {categoryCourses.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Gratuit</TableHead>
                        <TableHead>PDF</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            {course.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {course.description || "-"}
                          </TableCell>
                          <TableCell>
                            {course.is_free ? (
                              <Badge variant="secondary">Oui</Badge>
                            ) : (
                              <span className="text-muted-foreground">Non</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {course.pdf_url ? (
                              <Badge variant="outline">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(course)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(course.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-4 px-2">
                  Aucun cours dans cette catégorie
                </p>
              )}
            </div>
          );
        })}

        {/* Uncategorized courses */}
        {(() => {
          const uncategorized = courses.filter((c) => !c.category_id);
          if (uncategorized.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-muted-foreground">
                  Non classé
                </h2>
                <Badge variant="outline">{uncategorized.length} cours</Badge>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Gratuit</TableHead>
                      <TableHead>PDF</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uncategorized.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          {course.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {course.description || "-"}
                        </TableCell>
                        <TableCell>
                          {course.is_free ? (
                            <Badge variant="secondary">Oui</Badge>
                          ) : (
                            <span className="text-muted-foreground">Non</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.pdf_url ? (
                            <Badge variant="outline">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(course)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(course.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
};

export default AdminCourses;
