import { useState, useCallback, useEffect, MouseEvent } from "react";
import { ScheduleEvent } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";
import { RotateCw, Pencil, Trash2, Clock, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyScheduleProps {
  events: ScheduleEvent[];
  currentDate: Date;
  onEditEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onEventUpdate: (eventId: string, updates: {
    start_time?: string;
    end_time?: string
  }) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h to 21h
const PIXELS_PER_HOUR = 80;
const START_HOUR = 7;
const END_HOUR = 21;

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const formatTime = (timeStr: string): string => timeStr.slice(0, 5);

const formatDuration = (start: string, end: string): string => {
  const diff = parseTime(end) - parseTime(start);
  if (diff <= 0) return "";
  const h = Math.floor(diff);
  const m = Math.round((diff - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
};

const timeToString = (hours: number, minutes: number): string => {
  const h = Math.floor(hours);
  const m = Math.round(minutes);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
};

const roundToQuarter = (value: number): number => Math.round(value * 4) / 4;

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace("#", "");
  const bigint = parseInt(cleaned.length === 3 ? cleaned.split("").map(c => c + c).join("") : cleaned, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

interface DragState {
  eventId: string;
  type: "move" | "resize-top" | "resize-bottom";
  startY: number;
  originalTop: number;
  originalHeight: number;
}

const DailySchedule = ({
  events,
  currentDate,
  onEditEvent,
  onDeleteEvent,
  onEventUpdate,
}: DailyScheduleProps) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPosition, setDragPosition] = useState<{ top: number; height: number } | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const isToday = isSameDay(currentDate, now);
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = isToday && nowHour >= START_HOUR && nowHour <= END_HOUR;
  const nowTop = (nowHour - START_HOUR) * PIXELS_PER_HOUR;

  const getEventPosition = (event: ScheduleEvent) => {
    const startHour = parseTime(event.start_time);
    const endHour = parseTime(event.end_time);
    const duration = endHour - startHour;
    const top = (startHour - START_HOUR) * PIXELS_PER_HOUR;
    const height = duration * PIXELS_PER_HOUR;
    return { top, height };
  };

  const handleDragStart = useCallback((
    e: MouseEvent,
    eventId: string,
    type: "move" | "resize-top" | "resize-bottom",
    currentTop: number,
    currentHeight: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      eventId,
      type,
      startY: e.clientY,
      originalTop: currentTop,
      originalHeight: currentHeight,
    });
    setDragPosition({ top: currentTop, height: currentHeight });
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const deltaY = e.clientY - dragState.startY;

      let newTop = dragState.originalTop;
      let newHeight = dragState.originalHeight;

      if (dragState.type === "move") {
        newTop = dragState.originalTop + deltaY;
      } else if (dragState.type === "resize-top") {
        const maxDelta = dragState.originalHeight - 20;
        const constrainedDelta = Math.min(deltaY, maxDelta);
        newTop = dragState.originalTop + constrainedDelta;
        newHeight = dragState.originalHeight - constrainedDelta;
      } else if (dragState.type === "resize-bottom") {
        newHeight = Math.max(20, dragState.originalHeight + deltaY);
      }

      const maxTop = (END_HOUR - START_HOUR) * PIXELS_PER_HOUR - newHeight;
      newTop = Math.max(0, Math.min(maxTop, newTop));
      newHeight = Math.max(20, newHeight);

      setDragPosition({ top: newTop, height: newHeight });
    };

    const handleMouseUp = () => {
      if (dragState && dragPosition) {
        const startHourValue = roundToQuarter(dragPosition.top / PIXELS_PER_HOUR + START_HOUR);
        const durationHours = roundToQuarter(dragPosition.height / PIXELS_PER_HOUR);
        const endHourValue = startHourValue + durationHours;
        const startMinutes = (startHourValue % 1) * 60;
        const endMinutes = (endHourValue % 1) * 60;

        const updates: { start_time?: string; end_time?: string } = {};

        if (dragState.type === "move") {
          updates.start_time = timeToString(startHourValue, startMinutes);
          updates.end_time = timeToString(endHourValue, endMinutes);
        } else if (dragState.type === "resize-top") {
          updates.start_time = timeToString(startHourValue, startMinutes);
        } else if (dragState.type === "resize-bottom") {
          updates.end_time = timeToString(endHourValue, endMinutes);
        }

        if (Object.keys(updates).length > 0) {
          onEventUpdate(dragState.eventId, updates);
        }
      }

      setDragState(null);
      setDragPosition(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, dragPosition, onEventUpdate]);

  const dayLabel = format(currentDate, "EEEE d MMMM", { locale: fr });

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 overflow-hidden select-none shadow-[0_8px_30px_-12px_hsl(var(--accent)/0.15)]",
      dragState && "cursor-grabbing"
    )}>
      {/* Subtle teal glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative p-5 border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold capitalize bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {dayLabel}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {events.length} événement{events.length !== 1 ? "s" : ""} prévu{events.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isToday && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_-2px_hsl(var(--accent)/0.7)]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse" />
              Aujourd'hui
            </div>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="relative flex">
        {/* Hours column with vertical timeline */}
        <div className="relative border-r border-border/50 w-20 flex-shrink-0 bg-muted/10">
          {/* Vertical line */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="relative h-[80px] flex items-start justify-end pr-3 pt-2 text-xs font-medium text-muted-foreground/80 border-b border-border/20"
            >
              <span>{hour.toString().padStart(2, "0")}:00</span>
              {/* Timeline dot */}
              <div className="absolute -right-1 top-2 w-2 h-2 rounded-full bg-muted-foreground/30 border border-card" />
            </div>
          ))}
        </div>

        {/* Events area */}
        <div className="relative flex-1">
          {/* Hour grid lines */}
          {HOURS.map((hour, hIdx) => (
            <div
              key={hour}
              className={cn(
                "h-[80px] border-b border-border/20 transition-colors hover:bg-accent/[0.04]",
                hIdx % 2 === 1 && "bg-foreground/[0.015]"
              )}
            />
          ))}

          {/* Now line */}
          {showNowLine && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div className="relative flex items-center">
                <div className="absolute -left-2 w-4 h-4 rounded-full bg-destructive shadow-[0_0_10px_hsl(var(--destructive))] animate-pulse" />
                <div className="h-[2px] w-full bg-gradient-to-r from-destructive via-destructive to-destructive/30 shadow-[0_0_4px_hsl(var(--destructive)/0.6)]" />
                <span className="absolute -top-5 left-2 text-[10px] font-bold text-destructive bg-card/90 px-1.5 py-0.5 rounded backdrop-blur">
                  {format(now, "HH:mm")}
                </span>
              </div>
            </div>
          )}

          {/* Events */}
          {events.map((event, idx) => {
            const { top, height } = getEventPosition(event);
            const isRecurring = event.recurrence_type !== "none";
            const isBeingDragged = dragState?.eventId === event.id;
            const displayTop = isBeingDragged && dragPosition ? dragPosition.top : top;
            const displayHeight = isBeingDragged && dragPosition ? dragPosition.height : height;
            const isHovered = hoveredEventId === event.id;
            const color = event.color || "#14b8a6";
            const { r, g, b } = hexToRgb(color);
            const duration = formatDuration(event.start_time, event.end_time);

            return (
              <div
                key={event.id}
                className={cn(
                  "absolute left-3 right-3 rounded-xl overflow-hidden cursor-grab group transition-all duration-300 backdrop-blur-md border animate-fade-in",
                  isBeingDragged
                    ? "cursor-grabbing z-50 scale-[1.01] opacity-95"
                    : "hover:-translate-y-0.5"
                )}
                style={{
                  top: `${displayTop}px`,
                  height: `${Math.max(displayHeight, 50)}px`,
                  background: `linear-gradient(135deg, rgba(${r},${g},${b},0.25), rgba(${r},${g},${b},0.15))`,
                  borderColor: `rgba(${r},${g},${b},0.35)`,
                  borderLeft: `4px solid ${color}`,
                  boxShadow: isBeingDragged
                    ? `0 16px 40px -8px rgba(${r},${g},${b},0.5)`
                    : isHovered
                    ? `0 12px 32px -6px rgba(${r},${g},${b},0.45), 0 0 0 1px rgba(${r},${g},${b},0.4)`
                    : `0 4px 12px -2px rgba(${r},${g},${b},0.2)`,
                  animationDelay: `${Math.min(idx * 50, 400)}ms`,
                  animationFillMode: "backwards",
                }}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  handleDragStart(e, event.id, "move", top, height);
                }}
              >
                {/* Resize handle top */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-foreground/20 transition-opacity"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, event.id, "resize-top", top, height);
                  }}
                />

                {/* Content */}
                <div className="px-4 py-3 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-foreground/70 flex-shrink-0" />
                      {isRecurring && (
                        <RotateCw className="w-4 h-4 text-foreground/70 flex-shrink-0" />
                      )}
                      <span className="text-foreground font-bold truncate">{event.title}</span>
                    </div>
                    {duration && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-foreground/90 flex-shrink-0"
                        style={{ background: `rgba(${r},${g},${b},0.35)` }}
                      >
                        {duration}
                      </span>
                    )}
                  </div>
                  <div className="text-foreground/75 text-sm mt-1 font-medium">
                    {formatTime(event.start_time)} – {formatTime(event.end_time)}
                  </div>
                  {event.description && displayHeight > 80 && (
                    <p className="text-foreground/65 text-sm mt-2 line-clamp-3">
                      {event.description}
                    </p>
                  )}
                  {isRecurring && displayHeight > 110 && (
                    <p className="text-foreground/60 text-xs mt-2 italic">
                      {event.recurrence_type === "weekly" && "↻ Chaque semaine"}
                      {event.recurrence_type === "biweekly" && "↻ Toutes les 2 semaines"}
                      {event.recurrence_type === "monthly" && "↻ Chaque mois"}
                    </p>
                  )}
                </div>

                {/* Resize handle bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-foreground/20 transition-opacity"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, event.id, "resize-bottom", top, height);
                  }}
                />

                {/* Action buttons on hover */}
                <div className={cn(
                  "absolute top-2 right-2 hidden gap-1.5",
                  isHovered && !isBeingDragged && "flex"
                )}>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 backdrop-blur hover:bg-background border border-border/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/90 backdrop-blur hover:bg-destructive hover:text-destructive-foreground border border-border/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                  <CalendarX className="w-8 h-8 text-accent/70" />
                </div>
                <p className="text-base font-semibold text-foreground/80">Aucun événement</p>
                <p className="text-sm mt-1">Cette journée est libre — profitez-en !</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hint */}
      <div className="relative p-3 border-t border-border/50 bg-muted/20 text-center backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          ✨ Glissez un événement pour le déplacer • Tirez les bords pour ajuster la durée
        </p>
      </div>
    </div>
  );
};

export default DailySchedule;
