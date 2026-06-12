import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar, BookOpen } from "lucide-react";

interface Annale {
  id: string;
  title: string;
  year: number;
  category_id: string | null;
  quiz_id: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const DashboardAnnalesByYear = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from("annales").select("*").order("year", { ascending: false }),
        supabase.from("course_categories").select("id, name"),
      ]);
      setAnnales(a || []);
      setCategories(c || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || "—";

  const grouped = annales.reduce<Record<number, Annale[]>>((acc, a) => {
    (acc[a.year] ||= []).push(a);
    return acc;
  }, {});
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/annales")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <DashboardHeader title="Annales par année" description="Sélectionnez une année pour voir les annales disponibles" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : years.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Les annales seront bientôt disponibles</p>
          </div>
        ) : (
          <div className="space-y-8">
            {years.map((year) => (
              <section key={year}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" /> {year}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[year].map((annale) => (
                    <Card key={annale.id} className="hover:border-accent/50 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-accent/10">
                            <FileText className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{annale.title}</h3>
                            {annale.category_id && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {getCategoryName(annale.category_id)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {annale.quiz_id ? (
                          <Button variant="hero" size="sm" className="w-full" onClick={() => navigate(`/dashboard/qcm/${annale.quiz_id}`)}>
                            <BookOpen className="w-4 h-4 mr-1" /> Commencer le QCM
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center">QCM bientôt disponible</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardAnnalesByYear;
