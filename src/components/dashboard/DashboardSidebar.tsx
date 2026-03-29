import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  LayoutDashboard, 
  GraduationCap, 
  BarChart3, 
  Settings,
  LogOut,
  Shield,
  Calendar,
  Users,
  Wallet,
  Bell,
  HelpCircle,
  FileText,
  FileQuestion
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
  { icon: BookOpen, label: "Cours", href: "/dashboard/cours" },
  { icon: GraduationCap, label: "QCM", href: "/dashboard/qcm" },
  { icon: Calendar, label: "Emploi du temps", href: "/dashboard/emploi-du-temps" },
  { icon: Bell, label: "Rappels", href: "/dashboard/rappels" },
  { icon: HelpCircle, label: "Mes questions", href: "/dashboard/mes-questions" },
  { icon: BarChart3, label: "Progression", href: "/dashboard/progression" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/parametres" },
];

const adminItems = [
  { icon: BarChart3, label: "Dashboard Admin", href: "/admin" },
  { icon: Shield, label: "Gestion des cours", href: "/admin/cours" },
  { icon: FileQuestion, label: "Publier des QCM", href: "/tutor/quiz" },
  { icon: Users, label: "Gestion des tuteurs", href: "/admin/tuteurs" },
  { icon: Wallet, label: "Paiements tuteurs", href: "/admin/paiements" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadReplies, setUnreadReplies] = useState(0);
  const [newCoursesCount, setNewCoursesCount] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchUnreadReplies = async () => {
      if (!user) return;
      
      // Get all questions posted by this user
      const { data: myQuestions } = await supabase
        .from("question_discussions")
        .select("id")
        .eq("user_id", user.id)
        .is("parent_id", null);

      if (!myQuestions || myQuestions.length === 0) {
        setUnreadReplies(0);
        return;
      }

      const questionIds = myQuestions.map(q => q.id);

      // Count replies to those questions (not by the user themselves)
      const { count } = await supabase
        .from("question_discussions")
        .select("id", { count: "exact", head: true })
        .in("parent_id", questionIds)
        .neq("user_id", user.id);

      setUnreadReplies(count || 0);
    };

    const fetchNewCourses = async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneDayAgo);
      setNewCoursesCount(count || 0);
    };

    fetchUnreadReplies();
    fetchNewCourses();
  }, [user]);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            MED<span className="text-accent">OVA</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const showBadge = item.href === "/dashboard/mes-questions" && unreadReplies > 0;
          const showNewCoursesBadge = item.href === "/dashboard/cours" && newCoursesCount > 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-foreground",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="min-w-5 h-5 px-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                  {unreadReplies > 99 ? "99+" : unreadReplies}
                </span>
              )}
              {showNewCoursesBadge && (
                <span className="min-w-5 h-5 px-1.5 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  {newCoursesCount > 99 ? "99+" : newCoursesCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <span className="px-4 text-xs font-semibold uppercase text-muted-foreground/60">
                Administration
              </span>
            </div>
            {adminItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-foreground",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
