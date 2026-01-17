import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Check, 
  Clock, 
  Wallet, 
  DollarSign, 
  TrendingUp,
  CreditCard,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Earning {
  id: string;
  tutor_user_id: string;
  amount: number;
  description: string;
  earning_type: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  reference_id: string | null;
  tutor_name?: string;
  course_title?: string;
  course_category?: string;
}

interface TutorProfile {
  user_id: string;
  full_name: string | null;
}

interface Course {
  id: string;
  title: string;
  category: string | null;
}

const AdminPayments = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; earning: Earning | null }>({
    open: false,
    earning: null,
  });
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch all earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from("tutor_earnings")
        .select("*")
        .order("created_at", { ascending: false });

      if (earningsError) throw earningsError;

      // Fetch tutor profiles
      const tutorIds = [...new Set((earningsData || []).map((e) => e.tutor_user_id))];
      
      // Fetch course info for course-type earnings
      const courseIds = [...new Set(
        (earningsData || [])
          .filter((e) => e.earning_type === "course" && e.reference_id)
          .map((e) => e.reference_id)
      )];

      let coursesData: Course[] = [];
      if (courseIds.length > 0) {
        const { data, error: coursesError } = await supabase
          .from("courses")
          .select("id, title, category")
          .in("id", courseIds);
        
        if (coursesError) throw coursesError;
        coursesData = data || [];
      }
      
      if (tutorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", tutorIds);

        if (profilesError) throw profilesError;
        setTutors(profilesData || []);

        // Merge tutor names and course info with earnings
        const earningsWithDetails = (earningsData || []).map((earning) => {
          const tutor = profilesData?.find((p) => p.user_id === earning.tutor_user_id);
          const course = coursesData.find((c) => c.id === earning.reference_id);
          return {
            ...earning,
            tutor_name: tutor?.full_name || "Tuteur inconnu",
            course_title: course?.title || null,
            course_category: course?.category || null,
          };
        });
        setEarnings(earningsWithDetails);
      } else {
        setEarnings([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (earningId: string) => {
    setProcessingId(earningId);
    try {
      const { error } = await supabase
        .from("tutor_earnings")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", earningId);

      if (error) throw error;

      toast({
        title: "Paiement approuvé",
        description: "Le paiement a été approuvé avec succès",
      });

      fetchData();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le paiement",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentDialog.earning) return;

    setProcessingId(paymentDialog.earning.id);
    try {
      const { error } = await supabase
        .from("tutor_earnings")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference || null,
        })
        .eq("id", paymentDialog.earning.id);

      if (error) throw error;

      toast({
        title: "Paiement effectué",
        description: "Le paiement a été marqué comme effectué",
      });

      setPaymentDialog({ open: false, earning: null });
      setPaymentReference("");
      fetchData();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le paiement",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Check className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Wallet className="w-3 h-3 mr-1" />
            Payé
          </Badge>
        );
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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredEarnings = statusFilter === "all" 
    ? earnings 
    : earnings.filter((e) => e.status === statusFilter);

  // Calculate totals
  const totalPending = earnings
    .filter((e) => e.status === "pending")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalApproved = earnings
    .filter((e) => e.status === "approved")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalPaid = earnings
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalAll = earnings.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader
          title="Gestion des Paiements"
          description="Gérez les rémunérations des tuteurs"
        />
        <main className="p-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPending.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Check className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalApproved.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">Approuvé</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPaid.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">Payé</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalAll.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Paiements ({filteredEarnings.length})
                  </CardTitle>
                  <CardDescription>
                    Liste de tous les paiements des tuteurs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                </div>
              ) : filteredEarnings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun paiement trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tuteur</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cours</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEarnings.map((earning) => (
                      <TableRow key={earning.id}>
                        <TableCell className="font-medium">
                          {earning.tutor_name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {earning.description}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {earning.course_title || "-"}
                        </TableCell>
                        <TableCell>
                          {earning.course_category ? (
                            <Badge variant="secondary">{earning.course_category}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTypeLabel(earning.earning_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {Number(earning.amount).toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          {format(new Date(earning.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>{getStatusBadge(earning.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {earning.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(earning.id)}
                                disabled={processingId === earning.id}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approuver
                              </Button>
                            )}
                            {earning.status === "approved" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPaymentDialog({ open: true, earning })}
                                disabled={processingId === earning.id}
                              >
                                <Wallet className="w-4 h-4 mr-1" />
                                Marquer payé
                              </Button>
                            )}
                            {earning.status === "paid" && earning.payment_reference && (
                              <span className="text-xs text-muted-foreground">
                                Réf: {earning.payment_reference}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open, earning: paymentDialog.earning })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme payé</DialogTitle>
            <DialogDescription>
              Confirmez le paiement de {paymentDialog.earning?.amount?.toFixed(2)} € à {paymentDialog.earning?.tutor_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence de paiement (optionnel)</Label>
              <Input
                id="reference"
                placeholder="Ex: VIR-2024-001"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false, earning: null })}>
              Annuler
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={processingId !== null}>
              <Wallet className="w-4 h-4 mr-2" />
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;