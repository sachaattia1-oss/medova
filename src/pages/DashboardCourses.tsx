import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  Beaker, 
  Heart, 
  Brain, 
  Microscope, 
  Pill,
  Stethoscope,
  Activity,
  FlaskConical,
  Dna
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  order_index: number | null;
}

interface CourseCount {
  category_id: string;
  count: number;
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

const DashboardCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});
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

        // Fetch courses to count per category
        const { data: coursesData } = await supabase
          .from("courses")
          .select("category_id");

        if (coursesData) {
          const counts: Record<string, number> = {};
          coursesData.forEach((course) => {
            if (course.category_id) {
              counts[course.category_id] = (counts[course.category_id] || 0) + 1;
            }
          });
          setCourseCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          title="Cours" 
          description="Sélectionne une matière pour accéder aux cours"
        />

        {/* Categories Grid */}
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
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const Icon = categoryIcons[category.name] || BookOpen;
              const colorClass = categoryColors[category.name] || "from-gray-500 to-gray-600";
              const count = courseCounts[category.id] || 0;

              return (
                <button
                  key={category.id}
                  onClick={() => navigate(`/dashboard/cours/categorie/${category.id}`)}
                  className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all text-left"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {count} {count > 1 ? "cours" : "cours"}
                  </p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucune catégorie disponible</h3>
            <p className="text-sm text-muted-foreground">
              Les matières seront bientôt disponibles.
            </p>
          </div>
        )}
        
      </main>
    </div>
  );
};

export default DashboardCourses;
