import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";

interface Entry {
  courseId: string;
  courseTitle: string;
  count: number;
  years: number[];
}


const DashboardAnnalesCategory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;
      const [{ data: cat }, { data: qs }] = await Promise.all([
        supabase.from("course_categories").select("name").eq("id", categoryId).maybeSingle(),
        supabase
          .from("quiz_questions")
          .select("annale_year, quizzes!inner(id, courses!inner(id, title, category_id))")
          .eq("is_annale", true),
      ]);
      setCategoryName(cat?.name || "Matière");

      const map: Record<string, Entry> = {};
      (qs || []).forEach((q: any) => {
        const quiz = q.quizzes;
        const course = quiz?.courses;
        if (!course || course.category_id !== categoryId) return;
        const key = course.id;
        if (!map[key]) {
          map[key] = { courseId: course.id, courseTitle: course.title, count: 0, years: [] };
        }
        map[key].count++;
        if (q.annale_year && !map[key].years.includes(q.annale_year)) {
          map[key].years.push(q.annale_year);
        }
      });
      setEntries(Object.values(map).sort((a, b) => a.courseTitle.localeCompare(b.courseTitle)));

      setLoading(false);
    };
    fetchData();
  }, [categoryId]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/annales/par-matiere")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux matières
        </Button>
        <DashboardHeader title={`Annales - ${categoryName}`} description="Cours disposant d'annales dans cette matière" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aucune annale dans cette matière pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((e) => (
              <Card key={e.courseId} className="cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all"
                onClick={() => navigate(`/dashboard/annales/par-matiere/${categoryId}/${e.courseId}`)}>

                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 shrink-0">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-snug break-words">{e.courseTitle}</h3>
                    <div className="text-xs text-muted-foreground mt-1">
                      {e.count} question{e.count > 1 ? "s" : ""}
                      {e.years.length > 0 && (
                        <> · Années : {e.years.sort((a, b) => b - a).map(y => `${y}-${y + 1}`).join(", ")}</>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardAnnalesCategory;
