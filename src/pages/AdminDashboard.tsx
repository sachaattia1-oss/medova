import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Wifi, CreditCard, GraduationCap, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StudentProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_subscribed: boolean | null;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  student_type: string | null;
}

interface StudentStats {
  total: number;
  online: number;
  newThisWeek: number;
  newThisMonth: number;
  subscribed: number;
  unsubscribed: number;
}

type FilterType = "total" | "online" | "newWeek" | "newMonth" | "subscribed" | "unsubscribed";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<StudentStats>({
    total: 0, online: 0, newThisWeek: 0, newThisMonth: 0, subscribed: 0, unsubscribed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [newWeekIds, setNewWeekIds] = useState<string[]>([]);
  const [newMonthIds, setNewMonthIds] = useState<string[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);

  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (user && isAdmin) fetchStats();
  }, [user, isAdmin]);

  const fetchStats = async () => {
    try {
      const { data: studentRoles } = await supabase
        .from("user_roles").select("user_id").eq("role", "user");
      const ids = studentRoles?.map((r) => r.user_id) || [];
      setStudentIds(ids);

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: onlineData } = await supabase
        .from("user_activity").select("user_id")
        .eq("is_online", true).gte("last_active_at", fiveMinAgo)
        .in("user_id", ids.length > 0 ? ids : ["none"]);
      const oIds = onlineData?.map((d) => d.user_id) || [];
      setOnlineIds(oIds);

      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: newWeekData } = await supabase
        .from("profiles").select("user_id")
        .gte("created_at", weekAgo.toISOString())
        .in("user_id", ids.length > 0 ? ids : ["none"]);
      const nwIds = newWeekData?.map((d) => d.user_id) || [];
      setNewWeekIds(nwIds);

      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      const { data: newMonthData } = await supabase
        .from("profiles").select("user_id")
        .gte("created_at", monthAgo.toISOString())
        .in("user_id", ids.length > 0 ? ids : ["none"]);
      const nmIds = newMonthData?.map((d) => d.user_id) || [];
      setNewMonthIds(nmIds);

      const { data: subData } = await supabase
        .from("profiles").select("user_id")
        .eq("is_subscribed", true)
        .in("user_id", ids.length > 0 ? ids : ["none"]);
      const sIds = subData?.map((d) => d.user_id) || [];
      setSubscribedIds(sIds);

      setStats({
        total: ids.length,
        online: oIds.length,
        newThisWeek: nwIds.length,
        newThisMonth: nmIds.length,
        subscribed: sIds.length,
        unsubscribed: ids.length - sIds.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (filter: FilterType) => {
    setActiveFilter(filter);
    setLoadingStudents(true);

    let targetIds: string[] = [];
    switch (filter) {
      case "total": targetIds = studentIds; break;
      case "online": targetIds = onlineIds; break;
      case "newWeek": targetIds = newWeekIds; break;
      case "newMonth": targetIds = newMonthIds; break;
      case "subscribed": targetIds = subscribedIds; break;
      case "unsubscribed":
        targetIds = studentIds.filter((id) => !subscribedIds.includes(id));
        break;
    }

    if (targetIds.length === 0) {
      setFilteredStudents([]);
      setLoadingStudents(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_subscribed, subscription_type, subscription_expires_at, created_at, last_seen_at, student_type")
        .in("user_id", targetIds)
        .order("created_at", { ascending: false });
      setFilteredStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filterLabels: Record<FilterType, string> = {
    total: "Tous les étudiants",
    online: "Étudiants en ligne",
    newWeek: "Nouveaux (7 jours)",
    newMonth: "Nouveaux (30 jours)",
    subscribed: "Étudiants abonnés",
    unsubscribed: "Étudiants non abonnés",
  };

  const statCards: { title: string; value: number; icon: typeof Users; color: string; iconColor: string; filter: FilterType }[] = [
    { title: "Étudiants inscrits", value: stats.total, icon: Users, color: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400", filter: "total" },
    { title: "En ligne", value: stats.online, icon: Wifi, color: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-400", filter: "online" },
    { title: "Nouveaux (7 jours)", value: stats.newThisWeek, icon: UserPlus, color: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400", filter: "newWeek" },
    { title: "Nouveaux (30 jours)", value: stats.newThisMonth, icon: UserPlus, color: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "text-indigo-600 dark:text-indigo-400", filter: "newMonth" },
    { title: "Abonnés", value: stats.subscribed, icon: CreditCard, color: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400", filter: "subscribed" },
    { title: "Non abonnés", value: stats.unsubscribed, icon: GraduationCap, color: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400", filter: "unsubscribed" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader
          title="Tableau de bord Admin"
          description="Vue d'ensemble des étudiants et de l'activité sur la plateforme"
        />
        <main className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card) => (
                  <Card
                    key={card.title}
                    className="cursor-pointer hover:border-accent/50 hover:shadow-md transition-all"
                    onClick={() => handleCardClick(card.filter)}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className={`p-4 rounded-xl ${card.color}`}>
                        <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{card.value}</p>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Student list panel */}
              {activeFilter && (
                <Card className="mt-8">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setActiveFilter(null)}>
                          <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h3 className="text-lg font-semibold">{filterLabels[activeFilter]}</h3>
                        <Badge variant="secondary">{filteredStudents.length}</Badge>
                      </div>
                    </div>

                    {loadingStudents ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun étudiant dans cette catégorie</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Étudiant</TableHead>
                            <TableHead>Filière</TableHead>
                            <TableHead>Abonnement</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Expiration</TableHead>
                            <TableHead>Inscrit le</TableHead>
                            <TableHead>Dernière activité</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student) => (
                            <TableRow key={student.user_id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {student.full_name?.charAt(0)?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{student.full_name || "Sans nom"}</p>
                                    <p className="text-xs text-muted-foreground">{student.user_id.slice(0, 8)}…</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {student.is_subscribed ? (
                                  <Badge className="bg-emerald-500 hover:bg-emerald-500">Abonné</Badge>
                                ) : (
                                  <Badge variant="secondary">Non abonné</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {student.subscription_type || "—"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {student.subscription_expires_at
                                  ? format(new Date(student.subscription_expires_at), "d MMM yyyy", { locale: fr })
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(student.created_at), "d MMM yyyy", { locale: fr })}
                              </TableCell>
                              <TableCell className="text-sm">
                                {student.last_seen_at
                                  ? format(new Date(student.last_seen_at), "d MMM yyyy à HH:mm", { locale: fr })
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
