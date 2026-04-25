import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ViewMode } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";

interface ScheduleNavigationProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  weekStart: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const ScheduleNavigation = ({
  viewMode,
  onViewModeChange,
  currentDate,
  weekStart,
  onPrevious,
  onNext,
  onToday,
}: ScheduleNavigationProps) => {
  const weekEnd = addDays(weekStart, 6);
  const today = new Date();
  const isToday = viewMode === "day" ? isSameDay(currentDate, today) : false;

  const getDateLabel = () => {
    if (viewMode === "week") {
      const startMonth = format(weekStart, "MMM", { locale: fr });
      const endMonth = format(weekEnd, "MMM", { locale: fr });
      const startDay = format(weekStart, "d");
      const endDay = format(weekEnd, "d");
      const year = format(weekEnd, "yyyy");

      if (startMonth === endMonth) {
        return `${startDay} – ${endDay} ${startMonth} ${year}`;
      }
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
    }
    return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* View mode pills with sliding indicator */}
      <div className="relative flex items-center bg-muted/60 backdrop-blur-sm border border-border/50 rounded-full p-1 shadow-sm">
        <div
          className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-accent to-accent/80 shadow-[0_0_12px_-2px_hsl(var(--accent)/0.6)] transition-all duration-300 ease-out",
            viewMode === "week" ? "left-1" : "left-[calc(50%+0px)]"
          )}
        />
        <button
          onClick={() => onViewModeChange("week")}
          className={cn(
            "relative z-10 px-5 py-1.5 text-sm font-medium rounded-full transition-colors duration-300",
            viewMode === "week" ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Semaine
        </button>
        <button
          onClick={() => onViewModeChange("day")}
          className={cn(
            "relative z-10 px-5 py-1.5 text-sm font-medium rounded-full transition-colors duration-300",
            viewMode === "day" ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Jour
        </button>
      </div>

      {/* Navigation arrows + today */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          className="h-9 w-9 rounded-full border-border/60 bg-card/60 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={onToday}
          className={cn(
            "h-9 px-4 rounded-full gap-2 border-border/60 bg-card/60 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all",
            isToday && "border-accent/60 bg-accent/15 text-accent shadow-[0_0_12px_-4px_hsl(var(--accent)/0.6)]"
          )}
        >
          <Sparkles className={cn("h-3.5 w-3.5", isToday && "animate-pulse")} />
          <span className="text-sm font-medium">Aujourd'hui</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          className="h-9 w-9 rounded-full border-border/60 bg-card/60 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date chip */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 backdrop-blur-sm">
        <CalendarDays className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold capitalize bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {getDateLabel()}
        </span>
      </div>
    </div>
  );
};

export default ScheduleNavigation;
