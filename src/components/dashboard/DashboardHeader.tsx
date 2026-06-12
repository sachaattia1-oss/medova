import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

const DashboardHeader = ({ title, description }: DashboardHeaderProps) => {
  const { user } = useAuth();
  
  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  return (
    <header className="flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Bell className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-accent/20">
            <AvatarFallback className="bg-accent/10 text-accent font-medium text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">
              {user?.user_metadata?.full_name || "Utilisateur"}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
