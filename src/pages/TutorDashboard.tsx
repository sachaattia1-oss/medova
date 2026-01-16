import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  GraduationCap,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const TutorDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isApprovedTutor, isPendingTutor, isTutor, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If not a tutor, redirect to student dashboard
  if (!isTutor) {
    return <Navigate to="/dashboard" replace />;
  }

  // Pending tutor - show waiting screen
  if (isPendingTutor) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">En attente de validation</CardTitle>
            <CardDescription className="text-base mt-2">
              Votre demande de compte tuteur a bien été reçue et est en cours d'examen par notre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Prochaines étapes :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Compte créé avec succès
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  Validation en cours par un administrateur
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  Accès complet au tableau de bord tuteur
                </li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Vous recevrez un email dès que votre compte sera validé. 
              Vous pouvez fermer cette page en toute sécurité.
            </p>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved tutor - show full dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">GOPASS Tuteur</h1>
                <p className="text-xs text-muted-foreground">Tableau de bord</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Bienvenue, Tuteur ! 👋</h2>
          <p className="text-muted-foreground">
            Gérez vos cours, suivez la progression de vos étudiants et restez en contact avec eux.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Étudiants actifs", value: "—", icon: Users, color: "text-blue-500" },
            { label: "Cours créés", value: "—", icon: BookOpen, color: "text-green-500" },
            { label: "Messages non lus", value: "—", icon: MessageSquare, color: "text-amber-500" },
            { label: "Quiz complétés", value: "—", icon: BarChart3, color: "text-purple-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Mes étudiants
              </CardTitle>
              <CardDescription>
                Suivez la progression de vos étudiants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Les fonctionnalités de suivi des étudiants arrivent bientôt !</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="w-4 h-4" />
                Créer un cours
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart3 className="w-4 h-4" />
                Créer un quiz
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" />
                Voir les messages
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TutorDashboard;
