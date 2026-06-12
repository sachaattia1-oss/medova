import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ChevronRight, FileText } from "lucide-react";

const DashboardAnnalesByYear = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState<{ year: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("quiz_questions")
        .select("annale_year")
        .eq("is_annale", true)
        .not("annale_year", "is", null);
      const counts: Record<number, number> = {};
      (data || []).forEach((q: any) => {
        if (q.annale_year) counts[q.annale_year] = (counts[q.annale_year] || 0) + 1;
      });
      const arr = Object.entries(counts)
        .map(([y, c]) => ({ year: parseInt(y), count: c }))
        .sort((a, b) => b.year - a.year);
      setYears(arr);
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
        <DashboardHeader title="Annales par année" description="Sélectionnez une année pour voir les cours concernés" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : years.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aucune annale disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {years.map(({ year, count }) => (
              <Card
                key={year}
                className="cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all"
                onClick={() => navigate(`/dashboard/annales/par-annee/${year}`)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent/10">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{year}-{year + 1}</h3>
                    <p className="text-xs text-muted-foreground">
                      {count} question{count > 1 ? "s" : ""} d'annale
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardAnnalesByYear;
