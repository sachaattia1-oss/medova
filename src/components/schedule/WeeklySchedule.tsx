import { useState, useCallback, useRef, MouseEvent, useEffect } from "react";
import { ScheduleEvent } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";
import DraggableEvent from "./DraggableEvent";
import { addDays, isSameDay, startOfWeek, format } from "date-fns";
import { fr } from "date-fns/locale";

interface WeeklyScheduleProps {
  events: ScheduleEvent[];
  getEventsForDay: (dayIndex: number) => ScheduleEvent[];
  onEditEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onDayClick: (dayIndex: number) => void;
  onEventUpdate: (eventId: string, updates: {
    day_of_week?: number;
    start_time?: string;
    end_time?: string
  }) => void;
  weekStart?: Date;
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
const PIXELS_PER_HOUR = 60;
const START_HOUR = 7;
const END_HOUR = 21;

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const timeToString = (hours: number, minutes: number): string => {
  const h = Math.floor(hours);
  const m = Math.round(minutes);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
};

const roundToQuarter = (value: number): number => Math.round(value * 4) / 4;

interface DragState {
  eventId: string;
  type: "move" | "resize-top" | "resize-bottom";
  startY: number;
  startX: number;
  originalTop: number;
  originalHeight: number;
  originalDayIndex: number;
}

const WeeklySchedule = ({
  events,
  getEventsForDay,
  onEditEvent,
  onDeleteEvent,
  onDayClick,
  onEventUpdate,
  weekStart: weekStartProp,
}: WeeklyScheduleProps) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPosition, setDragPosition] = useState<{ top: number; height: number; dayIndex: number } | null>(null);
  const [now, setNow] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const columnWidthRef = useRef(0);

  // Determine the displayed week start (fallback to current week if not provided)
  const weekStart = weekStartProp ?? startOfWeek(new Date(), { weekStartsOn: 1 });

  // Update "now" line each minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7;
  const isCurrentWeek = isSameDay(
    startOfWeek(today, { weekStartsOn: 1 }),
    startOfWeek(weekStart, { weekStartsOn: 1 })
  );

  // Calculate "now line" position
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = isCurrentWeek && nowHour >= START_HOUR && nowHour <= END_HOUR;
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
    currentHeight: number,
    dayIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const hoursColumnWidth = 64;
      columnWidthRef.current = (containerWidth - hoursColumnWidth) / 7;
    }

    setDragState({
      eventId,
      type,
      startY: e.clientY,
      startX: e.clientX,
      originalTop: currentTop,
      originalHeight: currentHeight,
      originalDayIndex: dayIndex,
    });
    setDragPosition({ top: currentTop, height: currentHeight, dayIndex });
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const deltaY = e.clientY - dragState.startY;
      const deltaX = e.clientX - dragState.startX;

      let newTop = dragState.originalTop;
      let newHeight = dragState.originalHeight;
      let newDayIndex = dragState.originalDayIndex;

      if (dragState.type === "move") {
        newTop = dragState.originalTop + deltaY;
        const dayDelta = Math.round(deltaX / columnWidthRef.current);
        newDayIndex = Math.max(0, Math.min(6, dragState.originalDayIndex + dayDelta));
      } else if (dragState.type === "resize-top") {
        const maxDelta = dragState.originalHeight - 15;
        const constrainedDelta = Math.min(deltaY, maxDelta);
        newTop = dragState.originalTop + constrainedDelta;
        newHeight = dragState.originalHeight - constrainedDelta;
      } else if (dragState.type === "resize-bottom") {
        newHeight = Math.max(15, dragState.originalHeight + deltaY);
      }

      const maxTop = (END_HOUR - START_HOUR) * PIXELS_PER_HOUR - newHeight;
      newTop = Math.max(0, Math.min(maxTop, newTop));
      newHeight = Math.max(15, newHeight);

      setDragPosition({ top: newTop, height: newHeight, dayIndex: newDayIndex });
    };

    const handleMouseUp = () => {
      if (dragState && dragPosition) {
        const startHourValue = roundToQuarter(dragPosition.top / PIXELS_PER_HOUR + START_HOUR);
        const durationHours = roundToQuarter(dragPosition.height / PIXELS_PER_HOUR);
        const endHourValue = startHourValue + durationHours;
        const startMinutes = (startHourValue % 1) * 60;
        const endMinutes = (endHourValue % 1) * 60;

        const updates: { day_of_week?: number; start_time?: string; end_time?: string } = {};

        if (dragState.type === "move") {
          updates.start_time = timeToString(startHourValue, startMinutes);
          updates.end_time = timeToString(endHourValue, endMinutes);
          if (dragPosition.dayIndex !== dragState.originalDayIndex) {
            updates.day_of_week = dragPosition.dayIndex;
          }
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 overflow-hidden select-none shadow-[0_8px_30px_-12px_hsl(var(--accent)/0.15)]",
        dragState && "cursor-grabbing"
      )}
    >
      {/* Subtle teal glow accent */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      {/* Header with days */}
      <div className="relative grid grid-cols-8 border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent backdrop-blur-sm">
        <div className="p-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/50 flex items-center justify-center">
          Heure
        </div>
        {DAYS.map((day, index) => {
          const dayDate = addDays(weekStart, index);
          const isToday = isSameDay(dayDate, today);
          return (
            <div
              key={day.label}
              className={cn(
                "relative p-3 text-center cursor-pointer transition-all duration-200 group",
                index < DAYS.length - 1 && "border-r border-border/50",
                isToday
                  ? "bg-gradient-to-b from-accent/15 to-transparent"
                  : "hover:bg-muted/40"
              )}
              onClick={() => onDayClick(index)}
            >
              <div className={cn(
                "text-[10px] font-semibold uppercase tracking-wider transition-colors",
                isToday ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
              )}>
                <span className="hidden md:inline">{day.label}</span>
                <span className="md:hidden">{day.short}</span>
              </div>
              <div className={cn(
                "text-2xl font-bold mt-0.5 transition-colors",
                isToday ? "text-accent" : "text-foreground/80 group-hover:text-foreground"
              )}>
                {format(dayDate, "d")}
              </div>
              {isToday && (
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_-2px_hsl(var(--accent)/0.7)] animate-fade-in">
                  <span className="w-1 h-1 rounded-full bg-accent-foreground animate-pulse" />
                  Aujourd'hui
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule grid */}
      <div className="relative grid grid-cols-8">
        {/* Hours column */}
        <div className="border-r border-border/50 bg-muted/10">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[60px] flex items-start justify-end pr-2 pt-1 text-[10px] font-medium text-muted-foreground/70 border-b border-border/20"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Days columns */}
        {DAYS.map((day, dayIndex) => {
          const dayDate = addDays(weekStart, dayIndex);
          const isToday = isSameDay(dayDate, today);
          const dayEvents = getEventsForDay(dayIndex);
          return (
            <div
              key={day.label}
              className={cn(
                "relative group/col",
                dayIndex < DAYS.length - 1 && "border-r border-border/50",
                isToday && "bg-accent/[0.03]"
              )}
            >
              {/* Hour grid lines with subtle alternating */}
              {HOURS.map((hour, hIdx) => (
                <div
                  key={hour}
                  className={cn(
                    "h-[60px] border-b border-border/20 cursor-pointer transition-colors hover:bg-accent/[0.06]",
                    hIdx % 2 === 1 && "bg-foreground/[0.015]"
                  )}
                />
              ))}

              {/* Now line */}
              {showNowLine && isToday && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none"
                  style={{ top: `${nowTop}px` }}
                >
                  <div className="relative flex items-center">
                    <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_hsl(var(--destructive))] animate-pulse" />
                    <div className="h-[2px] w-full bg-gradient-to-r from-destructive via-destructive to-destructive/40 shadow-[0_0_4px_hsl(var(--destructive)/0.6)]" />
                  </div>
                </div>
              )}

              {/* Events */}
              {dayEvents.map((event, idx) => {
                const { top, height } = getEventPosition(event);
                const isBeingDragged = dragState?.eventId === event.id;

                return (
                  <DraggableEvent
                    key={`${event.id}-${dayIndex}`}
                    event={event}
                    top={top}
                    height={height}
                    dayIndex={dayIndex}
                    isDragging={isBeingDragged}
                    dragPosition={isBeingDragged ? dragPosition || undefined : undefined}
                    onEditEvent={onEditEvent}
                    onDeleteEvent={onDeleteEvent}
                    onDragStart={handleDragStart}
                    compact
                    index={idx}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklySchedule;
