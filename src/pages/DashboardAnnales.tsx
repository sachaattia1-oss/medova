import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Calendar, BookOpen } from "lucide-react";

interface Annale {
  id: string;
  title: string;
  year: number;
  category_id: string | null;
  quiz_id: string | null;
  target_audience: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const DashboardAnnales = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: annalesData }, { data: catData }] = await Promise.all([
          supabase.from("annales").select("*").order("year", { ascending: false }),
          supabase.from("course_categories").select("id, name").order("order_index"),
        ]);
        setAnnales(annalesData || []);
        setCategories(catData || []);
      } catch (error) {
        console.error("Error fetching annales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const years = [...new Set(annales.map((a) => a.year))].sort((a, b) => b - a);

  const filtered = annales.filter((a) => {
    if (filterYear !== "all" && a.year !== parseInt(filterYear)) return false;
    if (filterCategory !== "all" && a.category_id !== filterCategory) return false;
    return true;
  });

  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "—";

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
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <DashboardHeader title="Annales" description="Entraînez-vous sur les annales d'examens sous forme de QCM" />

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Annales list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucune annale trouvée</h3>
            <p className="text-sm text-muted-foreground">
              {filterYear !== "all" || filterCategory !== "all"
                ? "Essayez de modifier vos filtres"
                : "Les annales seront bientôt disponibles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((annale) => {
              const isNew = Date.now() - new Date(annale.created_at).getTime() < 24 * 60 * 60 * 1000;
              return (
                <Card key={annale.id} className="group hover:border-accent/50 hover:shadow-lg transition-all relative">
                  {isNew && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                      Nouveau
                    </span>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-accent/10">
                        <FileText className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{annale.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {annale.year}
                          </Badge>
                          {annale.category_id && (
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryName(annale.category_id)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {annale.quiz_id ? (
                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/dashboard/qcm/${annale.quiz_id}`)}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Commencer le QCM
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">QCM bientôt disponible</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardAnnales;
