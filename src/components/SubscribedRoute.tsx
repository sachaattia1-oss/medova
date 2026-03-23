import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface SubscribedRouteProps {
  children: ReactNode;
}

const SubscribedRoute = ({ children }: SubscribedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const { isAdmin, isTutor, loading: roleLoading } = useUserRole();

  const loading = authLoading || subLoading || roleLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins and tutors bypass
  if (isAdmin || isTutor || isSubscribed) {
    return <>{children}</>;
  }

  // Show paywall
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Contenu réservé aux abonnés</CardTitle>
              <CardDescription className="text-base mt-2">
                Abonne-toi pour accéder à tous les cours, QCM et fonctionnalités de MEDOVA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Avantages de l'abonnement
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Accès à tous les cours</li>
                  <li>QCM illimités avec corrections</li>
                  <li>Suivi de progression</li>
                  <li>Support prioritaire</li>
                </ul>
              </div>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/#tarifs">Voir les offres</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SubscribedRoute;
