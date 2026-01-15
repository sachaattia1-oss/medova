import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
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

  const getDateLabel = () => {
    if (viewMode === "week") {
      const startMonth = format(weekStart, "MMM", { locale: fr });
      const endMonth = format(weekEnd, "MMM", { locale: fr });
      const startDay = format(weekStart, "d");
      const endDay = format(weekEnd, "d");
      const year = format(weekEnd, "yyyy");

      if (startMonth === endMonth) {
        return `${startDay} - ${endDay} ${startMonth} ${year}`;
      }
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    }
    return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="flex items-center gap-4">
      {/* View mode toggle */}
      <div className="flex bg-muted rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-4 rounded-md",
            viewMode === "week" && "bg-background shadow-sm"
          )}
          onClick={() => onViewModeChange("week")}
        >
          Semaine
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-4 rounded-md",
            viewMode === "day" && "bg-background shadow-sm"
          )}
          onClick={() => onViewModeChange("day")}
        >
          Jour
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday} className="gap-2">
          <Calendar className="h-4 w-4" />
          Aujourd'hui
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date label */}
      <h2 className="text-lg font-semibold capitalize">{getDateLabel()}</h2>
    </div>
  );
};

export default ScheduleNavigation;
