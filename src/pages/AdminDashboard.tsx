import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, Wifi, CreditCard, GraduationCap } from "lucide-react";

interface StudentStats {
  total: number;
  online: number;
  newThisWeek: number;
  newThisMonth: number;
  subscribed: number;
  unsubscribed: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    online: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    subscribed: 0,
    unsubscribed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    try {
      // Get all student user_ids (role = 'user')
      const { data: studentRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");

      const studentIds = studentRoles?.map((r) => r.user_id) || [];
      const total = studentIds.length;

      // Online students (active in last 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: onlineData } = await supabase
        .from("user_activity")
        .select("user_id")
        .eq("is_online", true)
        .gte("last_active_at", fiveMinAgo)
        .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

      // New this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: newWeekProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .gte("created_at", weekAgo.toISOString())
        .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

      // New this month
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const { data: newMonthProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .gte("created_at", monthAgo.toISOString())
        .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

      // Subscribed students
      const { data: subscribedProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("is_subscribed", true)
        .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

      const subscribed = subscribedProfiles?.length || 0;

      setStats({
        total,
        online: onlineData?.length || 0,
        newThisWeek: newWeekProfiles?.length || 0,
        newThisMonth: newMonthProfiles?.length || 0,
        subscribed,
        unsubscribed: total - subscribed,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
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

  const statCards = [
    {
      title: "Étudiants inscrits",
      value: stats.total,
      icon: Users,
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "En ligne",
      value: stats.online,
      icon: Wifi,
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Nouveaux (7 jours)",
      value: stats.newThisWeek,
      icon: UserPlus,
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Nouveaux (30 jours)",
      value: stats.newThisMonth,
      icon: UserPlus,
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Abonnés",
      value: stats.subscribed,
      icon: CreditCard,
      color: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Non abonnés",
      value: stats.unsubscribed,
      icon: GraduationCap,
      color: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card) => (
                <Card key={card.title}>
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
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
