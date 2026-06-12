import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  quiz_id: string | null;
  created_at: string;
}

const DashboardAnnalesCategory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;
      const [{ data: cat }, { data: a }] = await Promise.all([
        supabase.from("course_categories").select("name").eq("id", categoryId).maybeSingle(),
        supabase
          .from("annales")
          .select("id, title, year, quiz_id, created_at")
          .eq("category_id", categoryId)
          .order("year", { ascending: false }),
      ]);
      setCategoryName(cat?.name || "Matière");
      setAnnales(a || []);
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
        <DashboardHeader title={`Annales - ${categoryName}`} description="Annales disponibles dans cette matière" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          </div>
        ) : annales.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aucune annale dans cette matière pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {annales.map((annale) => (
              <Card key={annale.id} className="hover:border-accent/50 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{annale.title}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        <Calendar className="w-3 h-3 mr-1" /> {annale.year}
                      </Badge>
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
        )}
      </main>
    </div>
  );
};

export default DashboardAnnalesCategory;
