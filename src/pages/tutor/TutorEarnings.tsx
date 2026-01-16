import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, CheckCircle, Wallet, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Earning {
  id: string;
  amount: number;
  description: string;
  earning_type: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  payment_reference: string | null;
}

const TutorEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("tutor_earnings")
          .select("*")
          .eq("tutor_user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEarnings(data || []);
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  // Calculate totals
  const totalEarnings = earnings.reduce((acc, e) => acc + Number(e.amount), 0);
  const pendingEarnings = earnings
    .filter((e) => e.status === "pending")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const approvedEarnings = earnings
    .filter((e) => e.status === "approved")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const paidEarnings = earnings
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">En attente</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Approuvé</Badge>;
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Payé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "course":
        return "Cours";
      case "quiz":
        return "QCM";
      case "message":
        return "Message";
      case "bonus":
        return "Bonus";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Rémunération</h1>
        <p className="text-muted-foreground mt-1">
          Suivez vos gains et paiements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des gains
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEarnings.toFixed(2)} €</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingEarnings.toFixed(2)} €</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approuvé
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{approvedEarnings.toFixed(2)} €</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payé
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidEarnings.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings List */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des gains</CardTitle>
          <CardDescription>
            Détail de toutes vos rémunérations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : earnings.length > 0 ? (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span className="font-medium">{earning.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(earning.earning_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(earning.created_at), "dd MMM yyyy", { locale: fr })}
                      </span>
                      {earning.paid_at && (
                        <span className="text-green-600">
                          Payé le {format(new Date(earning.paid_at), "dd MMM yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">{Number(earning.amount).toFixed(2)} €</span>
                    {getStatusBadge(earning.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Aucun gain pour le moment</h3>
              <p className="text-sm text-muted-foreground">
                Vos gains apparaîtront ici lorsque vous créerez du contenu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorEarnings;