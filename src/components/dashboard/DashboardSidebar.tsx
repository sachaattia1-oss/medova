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
  FileQuestion,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface SidebarContentProps {
  isAdmin: boolean;
  unreadReplies: number;
  newCoursesCount: number;
  onNavigate?: () => void;
  signOut: () => void;
}

const SidebarContent = ({ isAdmin, unreadReplies, newCoursesCount, onNavigate, signOut }: SidebarContentProps) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            MED<span className="text-accent">OVA</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const showBadge = item.href === "/dashboard/mes-questions" && unreadReplies > 0;
          const showNewCoursesBadge = item.href === "/dashboard/cours" && newCoursesCount > 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "nav-link group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-foreground",
                isActive
                  ? "nav-link-active bg-accent/10 text-accent"
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="nav-icon w-5 h-5" />
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
                  onClick={onNavigate}
                  className={cn(
                    "nav-link nav-link-admin group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-foreground",
                    isActive ? "nav-link-active" : ""
                  )}
                >
                  <item.icon className="nav-icon w-5 h-5" />
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
    </div>
  );
};

const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadReplies, setUnreadReplies] = useState(0);
  const [newCoursesCount, setNewCoursesCount] = useState(0);
  const [open, setOpen] = useState(false);

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

      if (location.pathname === "/dashboard/mes-questions") {
        localStorage.setItem(`questions_last_seen_${user.id}`, new Date().toISOString());
        setUnreadReplies(0);
        return;
      }

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

      const lastSeen = localStorage.getItem(`questions_last_seen_${user.id}`) 
        || new Date(0).toISOString();

      const { count } = await supabase
        .from("question_discussions")
        .select("id", { count: "exact", head: true })
        .in("parent_id", questionIds)
        .neq("user_id", user.id)
        .gt("created_at", lastSeen);

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
  }, [user, location.pathname]);

  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur border-b border-border/50 flex items-center justify-between px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-card">
              <SidebarContent
                isAdmin={isAdmin}
                unreadReplies={unreadReplies}
                newCoursesCount={newCoursesCount}
                onNavigate={() => setOpen(false)}
                signOut={signOut}
              />
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">
              MED<span className="text-accent">OVA</span>
            </span>
          </Link>
          <div className="w-9" />
        </div>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 flex flex-col">
      <SidebarContent
        isAdmin={isAdmin}
        unreadReplies={unreadReplies}
        newCoursesCount={newCoursesCount}
        signOut={signOut}
      />
    </aside>
  );
};

export default DashboardSidebar;
