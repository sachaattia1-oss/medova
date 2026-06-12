import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const DashboardAnnalesBySubject = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: annales }] = await Promise.all([
        supabase.from("course_categories").select("id, name, description").order("order_index"),
        supabase.from("annales").select("category_id"),
      ]);
      setCategories(cats || []);
      const c: Record<string, number> = {};
      (annales || []).forEach((a) => {
        if (a.category_id) c[a.category_id] = (c[a.category_id] || 0) + 1;
      });
      setCounts(c);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/annales")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <DashboardHeader title="Annales par matière" description="Choisissez une matière pour voir ses annales" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <p className="text-sm text-muted-foreground">Aucune matière disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all"
                onClick={() => navigate(`/dashboard/annales/par-matiere/${cat.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-accent/10 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{cat.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        {counts[cat.id] || 0} annale{(counts[cat.id] || 0) > 1 ? "s" : ""}
                      </div>
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

export default DashboardAnnalesBySubject;
