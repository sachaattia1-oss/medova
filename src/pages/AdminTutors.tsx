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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, Clock, Users, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TutorRequest {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  tutor_requested_at: string | null;
  is_tutor_approved: boolean | null;
  tutor_approved_at: string | null;
  created_at: string;
}

const AdminTutors = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && isAdmin) {
      fetchTutorRequests();
    }
  }, [user, isAdmin]);

  const fetchTutorRequests = async () => {
    try {
      console.log("Fetching tutor requests...");
      
      // Get all users with tutor role
      const { data: tutorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "tutor");

      console.log("Tutor roles result:", { tutorRoles, rolesError });

      if (rolesError) throw rolesError;

      if (!tutorRoles || tutorRoles.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const tutorUserIds = tutorRoles.map((r) => r.user_id);
      console.log("Tutor user IDs:", tutorUserIds);

      // Get their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, tutor_requested_at, is_tutor_approved, tutor_approved_at, created_at")
        .in("user_id", tutorUserIds)
        .order("tutor_requested_at", { ascending: false });

      console.log("Profiles result:", { profiles, profilesError });

      if (profilesError) throw profilesError;

      setRequests(profiles || []);
    } catch (error) {
      console.error("Error fetching tutor requests:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes de tuteurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_tutor_approved: true,
          tutor_approved_at: new Date().toISOString(),
          tutor_approved_by: user?.id,
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Send approval email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.email) {
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'tutor-approved',
            recipientEmail: profile.email,
            idempotencyKey: `tutor-approved-${userId}`,
            templateData: {
              name: profile.full_name,
              dashboardUrl: `${window.location.origin}/tutor`,
            },
          },
        }).catch((e) => console.error('tutor-approved email failed', e));
      }

      toast({
        title: "Tuteur approuvé",
        description: "Le compte tuteur a été activé avec succès",
      });

      fetchTutorRequests();
    } catch (error) {
      console.error("Error approving tutor:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le tuteur",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      // Remove tutor role and set back to user
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: "user" })
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // Clear tutor fields
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_tutor_approved: false,
          tutor_requested_at: null,
          tutor_approved_at: null,
          tutor_approved_by: null,
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      toast({
        title: "Demande refusée",
        description: "La demande de tuteur a été refusée. L'utilisateur devient un étudiant.",
      });

      fetchTutorRequests();
    } catch (error) {
      console.error("Error rejecting tutor:", error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la demande",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_tutor_approved: false,
          tutor_approved_at: null,
          tutor_approved_by: null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Accès révoqué",
        description: "L'accès tuteur a été révoqué",
      });

      fetchTutorRequests();
    } catch (error) {
      console.error("Error revoking tutor:", error);
      toast({
        title: "Erreur",
        description: "Impossible de révoquer l'accès",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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

  const pendingRequests = requests.filter((r) => !r.is_tutor_approved);
  const approvedTutors = requests.filter((r) => r.is_tutor_approved);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <DashboardHeader 
          title="Gestion des Tuteurs" 
          description="Validez les demandes de compte tuteur et gérez les accès" 
        />
        <main className="p-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedTutors.length}</p>
                  <p className="text-sm text-muted-foreground">Tuteurs actifs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requests.length}</p>
                  <p className="text-sm text-muted-foreground">Total tuteurs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Demandes en attente ({pendingRequests.length})
                </CardTitle>
                <CardDescription>
                  Ces utilisateurs attendent la validation de leur compte tuteur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Date de demande</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={request.avatar_url || undefined} />
                              <AvatarFallback>
                                {request.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.full_name || "Sans nom"}</p>
                              <p className="text-xs text-muted-foreground">{request.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.tutor_requested_at 
                            ? format(new Date(request.tutor_requested_at), "d MMM yyyy à HH:mm", { locale: fr })
                            : "—"
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at), "d MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.user_id)}
                              disabled={processingId === request.user_id}
                              className="gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Approuver
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingId === request.user_id}
                                  className="gap-1 text-destructive hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                  Refuser
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Refuser la demande ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    L'utilisateur sera converti en étudiant standard et devra refaire une demande s'il souhaite devenir tuteur.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReject(request.user_id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Confirmer le refus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Approved tutors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                Tuteurs actifs ({approvedTutors.length})
              </CardTitle>
              <CardDescription>
                Liste des tuteurs validés et actifs sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedTutors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun tuteur actif pour le moment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tuteur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Approuvé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedTutors.map((tutor) => (
                      <TableRow key={tutor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={tutor.avatar_url || undefined} />
                              <AvatarFallback>
                                {tutor.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{tutor.full_name || "Sans nom"}</p>
                              <p className="text-xs text-muted-foreground">{tutor.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500 hover:bg-green-500">
                            Actif
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tutor.tutor_approved_at 
                            ? format(new Date(tutor.tutor_approved_at), "d MMM yyyy", { locale: fr })
                            : "—"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingId === tutor.user_id}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <UserX className="w-4 h-4" />
                                Révoquer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Révoquer l'accès tuteur ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Le tuteur perdra ses privilèges mais pourra toujours accéder à son compte. Vous pourrez le réactiver plus tard.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevoke(tutor.user_id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Révoquer l'accès
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Empty state */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : requests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Aucune demande de tuteur</h3>
                <p className="text-muted-foreground">
                  Les demandes de compte tuteur apparaîtront ici
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminTutors;
