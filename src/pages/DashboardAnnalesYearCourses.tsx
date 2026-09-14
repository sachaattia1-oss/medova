import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ChevronRight, FileText } from "lucide-react";

interface CategoryEntry {
  categoryId: string;
  categoryName: string;
  count: number;
}

const DashboardAnnalesYearCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { year } = useParams();
  const [entries, setEntries] = useState<CategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!year) return;
      const { data } = await supabase
        .from("quiz_questions")
        .select("id, quizzes!inner(id, courses(id, title, category_id, course_categories(id, name)))")
        .eq("is_annale", true)
        .eq("annale_year", parseInt(year));

      const map: Record<string, CategoryEntry> = {};
      (data || []).forEach((q: any) => {
        const cat = q.quizzes?.courses?.course_categories;
        if (!cat) return;
        if (!map[cat.id]) {
          map[cat.id] = { categoryId: cat.id, categoryName: cat.name, count: 0 };
        }
        map[cat.id].count++;
      });
      setEntries(Object.values(map).sort((a, b) => a.categoryName.localeCompare(b.categoryName)));
      setLoading(false);
    };
    fetchData();
  }, [year]);

  if (!user || !year) return null;
  const y = parseInt(year);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/annales/par-annee")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux années
        </Button>
        <DashboardHeader title={`Annales ${y}-${y + 1}`} description="Choisissez une matière pour enchaîner toutes ses annales de cette année" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aucune annale pour cette année</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((e) => (
              <Card key={e.categoryId} className="cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all"
                onClick={() => navigate(`/dashboard/annales/par-annee/${y}/${e.categoryId}`)}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 shrink-0">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-snug break-words">{e.categoryName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {e.count} question{e.count > 1 ? "s" : ""} d'annale
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardAnnalesYearCourses;
