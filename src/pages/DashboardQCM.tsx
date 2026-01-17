import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Beaker, 
  Heart, 
  Brain, 
  Microscope, 
  Pill,
  Activity,
  FlaskConical,
  FileQuestion,
  ChevronRight,
  Clock,
  Play
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  order_index: number | null;
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
}

// Icon mapping for UE categories
const categoryIcons: Record<string, React.ElementType> = {
  UE1: FlaskConical,
  UE2: Microscope,
  UE3: Beaker,
  UE4: Activity,
  UE7: Heart,
  UE9: Pill,
  UE10: Brain,
};

// Color mapping for UE categories
const categoryColors: Record<string, string> = {
  UE1: "from-blue-500 to-blue-600",
  UE2: "from-purple-500 to-purple-600",
  UE3: "from-green-500 to-green-600",
  UE4: "from-orange-500 to-orange-600",
  UE7: "from-red-500 to-red-600",
  UE9: "from-cyan-500 to-cyan-600",
  UE10: "from-pink-500 to-pink-600",
};

const DashboardQCM = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
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
          .select("id, title, category_id")
          .order("title");

        if (coursesData) setCourses(coursesData);

        // Fetch quizzes
        const { data: quizzesData } = await supabase
          .from("quizzes")
          .select("id, title, description, course_id, time_limit_minutes, is_free")
          .order("created_at", { ascending: false });

        if (quizzesData) setQuizzes(quizzesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter courses by selected category
  const filteredCourses = selectedCategoryId
    ? courses.filter((c) => c.category_id === selectedCategoryId)
    : [];

  // Filter quizzes by selected course
  const filteredQuizzes = selectedCourseId
    ? quizzes.filter((q) => q.course_id === selectedCourseId)
    : [];

  // Get category name
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Count quizzes per category
  const getQuizCountForCategory = (categoryId: string) => {
    const coursesInCategory = courses.filter((c) => c.category_id === categoryId);
    const courseIds = coursesInCategory.map((c) => c.id);
    return quizzes.filter((q) => q.course_id && courseIds.includes(q.course_id)).length;
  };

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
        <DashboardHeader 
          title="QCM" 
          description="Entraîne-toi avec les QCM par matière et par cours"
        />

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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/50">
                <Skeleton className="w-16 h-16 rounded-xl mb-4" />
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : !selectedCategoryId ? (
          // Show categories
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.length > 0 ? categories.map((category) => {
              const Icon = categoryIcons[category.name] || BookOpen;
              const colorClass = categoryColors[category.name] || "from-gray-500 to-gray-600";
              const quizCount = getQuizCountForCategory(category.id);

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all text-left"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {quizCount} {quizCount > 1 ? "QCM" : "QCM"} disponible{quizCount > 1 ? "s" : ""}
                  </p>
                </button>
              );
            }) : (
              <div className="col-span-full text-center py-12 bg-card rounded-2xl border border-border/50">
                <FileQuestion className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Aucune catégorie disponible</h3>
                <p className="text-sm text-muted-foreground">
                  Les matières seront bientôt disponibles.
                </p>
              </div>
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
                          {courseQuizCount} {courseQuizCount > 1 ? "QCM" : "QCM"} disponible{courseQuizCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Aucun cours dans cette matière</h3>
                <p className="text-sm text-muted-foreground">
                  Les cours seront bientôt disponibles.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Show quizzes for selected course
          <div className="space-y-4">
            {filteredQuizzes.length > 0 ? filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:border-accent/50 transition-colors">
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
                  <Button onClick={() => navigate(`/dashboard/qcm/${quiz.id}`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Commencer
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <FileQuestion className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Aucun QCM pour ce cours</h3>
                <p className="text-sm text-muted-foreground">
                  Les QCM seront bientôt disponibles.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardQCM;