import { ScheduleEvent } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyScheduleProps {
  events: ScheduleEvent[];
  currentDate: Date;
  onEditEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h to 21h

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const formatTime = (timeStr: string): string => {
  return timeStr.slice(0, 5);
};

const DailySchedule = ({
  events,
  currentDate,
  onEditEvent,
  onDeleteEvent,
}: DailyScheduleProps) => {
  const getEventPosition = (event: ScheduleEvent) => {
    const startHour = parseTime(event.start_time);
    const endHour = parseTime(event.end_time);
    const duration = endHour - startHour;

    const top = (startHour - 7) * 80; // 80px per hour for day view
    const height = duration * 80;

    return { top, height };
  };

  const dayLabel = format(currentDate, "EEEE d MMMM", { locale: fr });

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <h3 className="text-lg font-semibold capitalize">{dayLabel}</h3>
        <p className="text-sm text-muted-foreground">
          {events.length} événement{events.length !== 1 ? "s" : ""} prévu{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Schedule */}
      <div className="flex">
        {/* Hours column */}
        <div className="border-r border-border/50 w-20 flex-shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[80px] flex items-start justify-center pt-2 text-sm text-muted-foreground border-b border-border/30"
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Events area */}
        <div className="relative flex-1">
          {/* Hour grid lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[80px] border-b border-border/30"
            />
          ))}

          {/* Events */}
          {events.map((event) => {
            const { top, height } = getEventPosition(event);
            const isRecurring = event.recurrence_type !== "none";
            return (
              <div
                key={event.id}
                className="absolute left-2 right-2 rounded-xl px-4 py-2 overflow-hidden cursor-pointer group transition-all hover:ring-2 hover:ring-primary/50 shadow-sm"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 40)}px`,
                  backgroundColor: event.color || "#3b82f6",
                }}
              >
                <div className="flex items-center gap-2">
                  {isRecurring && (
                    <RotateCw className="w-4 h-4 text-white/80 flex-shrink-0" />
                  )}
                  <span className="text-white font-medium">{event.title}</span>
                </div>
                <div className="text-white/80 text-sm mt-1">
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </div>
                {event.description && height > 80 && (
                  <p className="text-white/70 text-sm mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
                {isRecurring && height > 60 && (
                  <p className="text-white/60 text-xs mt-1">
                    {event.recurrence_type === "weekly" && "Chaque semaine"}
                    {event.recurrence_type === "biweekly" && "Toutes les 2 semaines"}
                    {event.recurrence_type === "monthly" && "Chaque mois"}
                  </p>
                )}
                
                {/* Action buttons on hover */}
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-white/90 hover:bg-destructive hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Aucun événement</p>
                <p className="text-sm">Ajoutez un événement pour cette journée</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySchedule;
