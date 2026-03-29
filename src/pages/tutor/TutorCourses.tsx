import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
import { Plus, Pencil, Trash2, FolderOpen, Upload, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  is_free: boolean | null;
  pdf_url: string | null;
  order_index: number | null;
  target_audience: string;
  created_by: string | null;
}

interface Category {
  id: string;
  name: string;
  order_index: number | null;
}

const TutorCourses = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    pdf_url: "",
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
        .select("*")
        .order("order_index", { ascending: true });

      if (catData) setCategories(catData);

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (coursesData) setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

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
      target_audience: "all",
    });
    setEditingCourse(null);
    setPdfFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Seuls les fichiers PDF sont acceptés");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 50 Mo");
        return;
      }
      setPdfFile(file);
    }
  };

  const uploadPdf = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("course-pdfs")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("course-pdfs")
      .getPublicUrl(filePath);

    return data.publicUrl;
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
        target_audience: course.target_audience || "all",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let pdfUrl = formData.pdf_url;

      if (pdfFile) {
        const uploadedUrl = await uploadPdf(pdfFile);
        if (uploadedUrl) {
          pdfUrl = uploadedUrl;
        }
      }

      const courseData = {
        title: formData.title,
        description: formData.description || null,
        category_id: formData.category_id || null,
        pdf_url: pdfUrl || null,
        is_free: formData.is_free,
        target_audience: formData.target_audience,
      };

      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", editingCourse.id);

        if (error) throw error;
        toast.success("Cours mis à jour");
      } else {
        const { error } = await supabase.from("courses").insert({ ...courseData, created_by: user?.id });

        if (error) throw error;
        toast.success("Cours créé");
      }

      await fetchData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setUploading(false);
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
          <h1 className="text-2xl font-bold">Mes cours</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos cours pour les étudiants
          </p>
        </div>
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
                <Label>Fichier PDF</Label>
                {formData.pdf_url && !pdfFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="text-sm flex-1 truncate">PDF actuel</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setFormData({ ...formData, pdf_url: "" })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : pdfFile ? (
                  <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setPdfFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">
                      Cliquer pour sélectionner un PDF
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
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
                  disabled={uploading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : editingCourse ? (
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
                      <TableHead>Public</TableHead>
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
                          <Badge variant="outline">
                            {course.target_audience === "terminale" ? "Terminale" : course.target_audience === "pass" ? "PASS" : "Tous"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {course.pdf_url ? (
                            <Badge variant="outline">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.created_by === user?.id && (
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
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                Aucun cours dans cette catégorie
              </div>
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
              <h2 className="text-xl font-semibold">Non classés</h2>
              <Badge variant="secondary">{uncategorized.length} cours</Badge>
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
    </div>
  );
};

export default TutorCourses;
