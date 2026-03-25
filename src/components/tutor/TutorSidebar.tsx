import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  FileQuestion,
  MessageSquare,
  HelpCircle,
  GraduationCap,
  LogOut,
  Wallet,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { label: "Accueil", icon: Home, path: "/tutor" },
  { label: "Mes cours", icon: BookOpen, path: "/tutor/cours" },
  { label: "Mes quiz", icon: FileQuestion, path: "/tutor/quiz" },
  { label: "Annales", icon: FileText, path: "/tutor/annales" },
  { label: "Questions QCM", icon: HelpCircle, path: "/tutor/discussions" },
  { label: "Messages", icon: MessageSquare, path: "/tutor/messages" },
  { label: "Rémunération", icon: Wallet, path: "/tutor/remuneration" },
];

const TutorSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [newQuestionsCount, setNewQuestionsCount] = useState(0);

  useEffect(() => {
    const fetchNewQuestions = async () => {
      if (!user) return;

      // Count unanswered top-level questions (no reply from tutor/admin yet)
      const { data: questions } = await supabase
        .from("question_discussions")
        .select("id")
        .is("parent_id", null);

      if (!questions || questions.length === 0) {
        setNewQuestionsCount(0);
        return;
      }

      // Get questions that have no replies yet
      const questionIds = questions.map(q => q.id);
      const { data: replies } = await supabase
        .from("question_discussions")
        .select("parent_id")
        .in("parent_id", questionIds);

      const answeredIds = new Set((replies || []).map(r => r.parent_id));
      const unanswered = questionIds.filter(id => !answeredIds.has(id));
      setNewQuestionsCount(unanswered.length);
    };

    fetchNewQuestions();
  }, [user]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/tutor" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">MEDOVA</h1>
            <p className="text-xs text-muted-foreground">Espace Tuteur</p>
          </div>
        </Link>
      </div>

      {/* Tutor profile */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-accent/20">
            <AvatarFallback className="bg-accent/10 text-accent font-medium">
              {user?.user_metadata?.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() || user?.email?.[0].toUpperCase() || "T"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name || "Tuteur"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/tutor" && location.pathname.startsWith(item.path));
          const showBadge = item.path === "/tutor/discussions" && newQuestionsCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.label}</span>
              {showBadge && (
                <span className="min-w-5 h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                  {newQuestionsCount > 99 ? "99+" : newQuestionsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default TutorSidebar;
