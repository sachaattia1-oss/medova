import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface SubscriptionGateProps {
  children: ReactNode;
}

const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { isSubscribed, loading: subLoading } = useSubscription();
  const { isAdmin, isTutor, loading: roleLoading } = useUserRole();

  const loading = subLoading || roleLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  // Admins and tutors bypass the gate
  if (isAdmin || isTutor || isSubscribed) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
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
  );
};

export default SubscriptionGate;
