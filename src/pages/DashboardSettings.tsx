import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Shield, CreditCard, CalendarDays, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Profile {
  full_name: string | null;
  is_subscribed: boolean | null;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  last_seen_at: string | null;
}

const DashboardSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isApprovedTutor, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, is_subscribed, subscription_type, subscription_expires_at, created_at, last_seen_at")
          .eq("user_id", user.id)
          .single();

        if (data) setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Administrateur</Badge>;
    if (isApprovedTutor) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Tuteur</Badge>;
    return <Badge variant="secondary">Étudiant</Badge>;
  };

  const getSubscriptionBadge = () => {
    if (isAdmin || isApprovedTutor) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Accès complet</Badge>;
    }
    if (!profile?.is_subscribed) {
      return <Badge variant="destructive">Non abonné</Badge>;
    }
    const typeLabel = profile.subscription_type === "annual" ? "Annuel" 
      : profile.subscription_type === "quad" ? "Quadrimestriel" 
      : profile.subscription_type || "Actif";
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{typeLabel}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader title="Paramètres" description="Informations sur votre compte" />
        <main className="p-8">
          <div className="max-w-2xl space-y-6">
            {/* Account Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  Informations du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading || roleLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <InfoRow
                      icon={<User className="w-4 h-4 text-muted-foreground" />}
                      label="Nom"
                      value={profile?.full_name || "Non renseigné"}
                    />
                    <Separator />
                    <InfoRow
                      icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                      label="Email"
                      value={user.email || "—"}
                    />
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Rôle</span>
                      </div>
                      {getRoleBadge()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading || roleLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Statut</span>
                      {getSubscriptionBadge()}
                    </div>
                    {profile?.subscription_expires_at && (
                      <>
                        <Separator />
                        <InfoRow
                          icon={<CalendarDays className="w-4 h-4 text-muted-foreground" />}
                          label="Expire le"
                          value={format(parseISO(profile.subscription_expires_at), "d MMMM yyyy", { locale: fr })}
                        />
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Activité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <InfoRow
                      icon={<CalendarDays className="w-4 h-4 text-muted-foreground" />}
                      label="Inscrit depuis"
                      value={profile?.created_at
                        ? format(parseISO(profile.created_at), "d MMMM yyyy", { locale: fr })
                        : "—"}
                    />
                    <Separator />
                    <InfoRow
                      icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                      label="Dernière connexion"
                      value={profile?.last_seen_at
                        ? format(parseISO(profile.last_seen_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                        : "—"}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

export default DashboardSettings;
