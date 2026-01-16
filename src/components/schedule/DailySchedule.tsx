import { useState, useCallback, useRef, useEffect, MouseEvent } from "react";
import { ScheduleEvent } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";
import { RotateCw, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const formatTime = (timeStr: string): string => {
  return timeStr.slice(0, 5);
};

const timeToString = (hours: number, minutes: number): string => {
  const h = Math.floor(hours);
  const m = Math.round(minutes);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
};

const roundToQuarter = (value: number): number => {
  return Math.round(value * 4) / 4;
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
      
      // Constrain to grid
      const maxTop = (21 - START_HOUR) * PIXELS_PER_HOUR - newHeight;
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
      "bg-card rounded-2xl border border-border/50 overflow-hidden select-none",
      dragState && "cursor-grabbing"
    )}>
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
            const isBeingDragged = dragState?.eventId === event.id;
            const displayTop = isBeingDragged && dragPosition ? dragPosition.top : top;
            const displayHeight = isBeingDragged && dragPosition ? dragPosition.height : height;
            const isHovered = hoveredEventId === event.id;
            
            return (
              <div
                key={event.id}
                className={cn(
                  "absolute left-2 right-2 rounded-xl overflow-hidden cursor-grab group transition-shadow",
                  isBeingDragged && "cursor-grabbing z-50 shadow-xl opacity-90",
                  !isBeingDragged && "hover:ring-2 hover:ring-primary/50 shadow-sm hover:shadow-lg"
                )}
                style={{
                  top: `${displayTop}px`,
                  height: `${Math.max(displayHeight, 40)}px`,
                  backgroundColor: event.color || "#3b82f6",
                }}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  handleDragStart(e, event.id, "move", top, height);
                }}
              >
                {/* Resize handle top */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/30 transition-opacity",
                    isHovered && "opacity-50"
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, event.id, "resize-top", top, height);
                  }}
                />
                
                {/* Content */}
                <div className="px-4 py-2 h-full flex flex-col">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-white/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isRecurring && (
                      <RotateCw className="w-4 h-4 text-white/80 flex-shrink-0" />
                    )}
                    <span className="text-white font-medium">{event.title}</span>
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </div>
                  {event.description && displayHeight > 80 && (
                    <p className="text-white/70 text-sm mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {isRecurring && displayHeight > 100 && (
                    <p className="text-white/60 text-xs mt-1">
                      {event.recurrence_type === "weekly" && "Chaque semaine"}
                      {event.recurrence_type === "biweekly" && "Toutes les 2 semaines"}
                      {event.recurrence_type === "monthly" && "Chaque mois"}
                    </p>
                  )}
                </div>
                
                {/* Resize handle bottom */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/30 transition-opacity",
                    isHovered && "opacity-50"
                  )}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, event.id, "resize-bottom", top, height);
                  }}
                />
                
                {/* Action buttons on hover */}
                <div className={cn(
                  "absolute top-2 right-2 hidden gap-2",
                  isHovered && !isBeingDragged && "flex"
                )}>
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
      
      {/* Hint */}
      <div className="p-3 border-t border-border/50 bg-muted/20 text-center">
        <p className="text-xs text-muted-foreground">
          💡 Glissez un événement pour le déplacer • Tirez les bords haut/bas pour modifier la durée
        </p>
      </div>
    </div>
  );
};

export default DailySchedule;
