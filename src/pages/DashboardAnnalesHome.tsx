import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen } from "lucide-react";

const DashboardAnnalesHome = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
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
        <DashboardHeader
          title="Annales"
          description="Choisissez un mode de consultation des annales"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card
            className="group cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all"
            onClick={() => navigate("/dashboard/annales/par-annee")}
          >
            <CardContent className="p-8 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-accent/10 mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sélection par année</h3>
              <p className="text-sm text-muted-foreground">
                Parcourez les annales triées par année d'examen
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all"
            onClick={() => navigate("/dashboard/annales/par-matiere")}
          >
            <CardContent className="p-8 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-accent/10 mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sélection par cours</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez une matière pour accéder à ses annales
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardAnnalesHome;
