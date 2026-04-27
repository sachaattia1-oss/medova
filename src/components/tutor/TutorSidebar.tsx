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
  ArrowLeft,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { label: "Accueil", icon: Home, path: "/tutor" },
  { label: "Mes cours", icon: BookOpen, path: "/tutor/cours" },
  { label: "Mes quiz", icon: FileQuestion, path: "/tutor/quiz" },
  { label: "Questions QCM", icon: HelpCircle, path: "/tutor/discussions" },
  { label: "Messages", icon: MessageSquare, path: "/tutor/messages" },
  { label: "Rémunération", icon: Wallet, path: "/tutor/remuneration" },
];

interface ContentProps {
  user: ReturnType<typeof useAuth>["user"];
  signOut: () => void;
  isAdmin: boolean;
  newQuestionsCount: number;
  onNavigate?: () => void;
}

const SidebarInner = ({ user, signOut, isAdmin, newQuestionsCount, onNavigate }: ContentProps) => {
  const location = useLocation();
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/tutor" onClick={onNavigate} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">MEDOVA</h1>
            <p className="text-xs text-muted-foreground">{isAdmin ? "Espace Admin" : "Espace Tuteur"}</p>
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/tutor" && location.pathname.startsWith(item.path));
          const showBadge = item.path === "/tutor/discussions" && newQuestionsCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
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

      <div className="p-4 border-t border-border space-y-1">
        {isAdmin && (
          <Link
            to="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour au dashboard</span>
          </Link>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

const TutorSidebar = () => {
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [newQuestionsCount, setNewQuestionsCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchNewQuestions = async () => {
      if (!user) return;

      const { data: questions } = await supabase
        .from("question_discussions")
        .select("id")
        .is("parent_id", null);

      if (!questions || questions.length === 0) {
        setNewQuestionsCount(0);
        return;
      }

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

  if (isMobile) {
    return (
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-card">
            <SidebarInner
              user={user}
              signOut={signOut}
              isAdmin={isAdmin}
              newQuestionsCount={newQuestionsCount}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <Link to="/tutor" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">MEDOVA</span>
        </Link>
        <div className="w-9" />
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      <SidebarInner
        user={user}
        signOut={signOut}
        isAdmin={isAdmin}
        newQuestionsCount={newQuestionsCount}
      />
    </aside>
  );
};

export default TutorSidebar;
