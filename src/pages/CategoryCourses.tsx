import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CourseCard from "@/components/dashboard/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  is_free: boolean | null;
  thumbnail_url: string | null;
  pdf_url: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const CategoryCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;

      try {
        // Fetch category info
        const { data: catData } = await supabase
          .from("course_categories")
          .select("*")
          .eq("id", categoryId)
          .maybeSingle();

        if (catData) setCategory(catData);

        // Fetch courses in this category
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .eq("category_id", categoryId)
          .order("order_index", { ascending: true });

        if (coursesData) setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  // Filter courses by search
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="ml-64 p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/cours")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux matières
        </Button>

        <DashboardHeader 
          title={category?.name || "Cours"} 
          description={category?.description || "Cours de cette matière"}
        />

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border/50">
                <Skeleton className="aspect-video rounded-xl mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                description={course.description || undefined}
                category={category?.name}
                isFree={course.is_free || false}
                thumbnailUrl={course.thumbnail_url || undefined}
                pdfUrl={course.pdf_url || undefined}
                onClick={() => navigate(`/dashboard/cours/${course.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucun cours trouvé</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? "Essayez avec d'autres mots-clés." 
                : "Aucun cours n'a encore été ajouté à cette matière."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryCourses;
