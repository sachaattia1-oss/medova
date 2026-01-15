import { ScheduleEvent } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeeklyScheduleProps {
  events: ScheduleEvent[];
  getEventsForDay: (dayIndex: number) => ScheduleEvent[];
  onEditEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onDayClick: (dayIndex: number) => void;
}

const DAYS = [
  { label: "Lundi", short: "Lun" },
  { label: "Mardi", short: "Mar" },
  { label: "Mercredi", short: "Mer" },
  { label: "Jeudi", short: "Jeu" },
  { label: "Vendredi", short: "Ven" },
  { label: "Samedi", short: "Sam" },
  { label: "Dimanche", short: "Dim" },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h to 21h

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const formatTime = (timeStr: string): string => {
  return timeStr.slice(0, 5);
};

const WeeklySchedule = ({
  events,
  getEventsForDay,
  onEditEvent,
  onDeleteEvent,
  onDayClick,
}: WeeklyScheduleProps) => {
  const getEventPosition = (event: ScheduleEvent) => {
    const startHour = parseTime(event.start_time);
    const endHour = parseTime(event.end_time);
    const duration = endHour - startHour;

    const top = (startHour - 7) * 60; // 60px per hour
    const height = duration * 60;

    return { top, height };
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-border/50">
        <div className="p-4 text-center text-sm font-medium text-muted-foreground border-r border-border/50">
          Heure
        </div>
        {DAYS.map((day, index) => (
          <div
            key={day.label}
            className={cn(
              "p-4 text-center text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors",
              index < DAYS.length - 1 && "border-r border-border/50"
            )}
            onClick={() => onDayClick(index)}
          >
            <span className="hidden md:inline">{day.label}</span>
            <span className="md:hidden">{day.short}</span>
          </div>
        ))}
      </div>

      {/* Schedule grid */}
      <div className="grid grid-cols-8">
        {/* Hours column */}
        <div className="border-r border-border/50">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[60px] flex items-start justify-center pt-1 text-xs text-muted-foreground border-b border-border/30"
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Days columns */}
        {DAYS.map((day, dayIndex) => (
          <div
            key={day.label}
            className={cn(
              "relative",
              dayIndex < DAYS.length - 1 && "border-r border-border/50"
            )}
          >
            {/* Hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-border/30"
              />
            ))}

            {/* Events */}
            {getEventsForDay(dayIndex).map((event) => {
              const { top, height } = getEventPosition(event);
              const isRecurring = event.recurrence_type !== "none";
              return (
                <Tooltip key={`${event.id}-${dayIndex}`}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer group transition-all hover:ring-2 hover:ring-primary/50"
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 30)}px`,
                        backgroundColor: event.color || "#3b82f6",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {isRecurring && (
                          <RotateCw className="w-3 h-3 text-white/80 flex-shrink-0" />
                        )}
                        <span className="text-white text-xs font-medium truncate">
                          {event.title}
                        </span>
                      </div>
                      {height > 40 && (
                        <div className="text-white/80 text-[10px]">
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </div>
                      )}
                      
                      {/* Action buttons on hover */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-5 w-5 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(event);
                          }}
                        >
                          <Pencil className="h-3 w-3 text-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-5 w-5 bg-white/90 hover:bg-destructive hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(event.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </p>
                      {isRecurring && (
                        <p className="text-xs text-accent">
                          {event.recurrence_type === "weekly" && "Chaque semaine"}
                          {event.recurrence_type === "biweekly" && "Toutes les 2 semaines"}
                          {event.recurrence_type === "monthly" && "Chaque mois"}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-xs max-w-[200px]">{event.description}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;
