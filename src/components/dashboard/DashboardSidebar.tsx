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
  Users
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
  { icon: BarChart3, label: "Progression", href: "/dashboard/progression" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/parametres" },
];

const adminItems = [
  { icon: Shield, label: "Gestion des cours", href: "/admin/cours" },
  { icon: Users, label: "Gestion des tuteurs", href: "/admin/tuteurs" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            GO<span className="text-accent">PASS</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
