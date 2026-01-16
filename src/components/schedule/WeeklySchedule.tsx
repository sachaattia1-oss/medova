import { useState, useCallback, useRef, MouseEvent, useEffect } from "react";
import { ScheduleEvent } from "@/pages/DashboardSchedule";
import { cn } from "@/lib/utils";
import DraggableEvent from "./DraggableEvent";

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

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
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
}: WeeklyScheduleProps) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPosition, setDragPosition] = useState<{ top: number; height: number; dayIndex: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const columnWidthRef = useRef(0);

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
    
    // Calculate column width
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const hoursColumnWidth = 56; // Approximate width of hours column
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
      
      // Constrain to grid
      const maxTop = (21 - START_HOUR) * PIXELS_PER_HOUR - newHeight;
      newTop = Math.max(0, Math.min(maxTop, newTop));
      newHeight = Math.max(15, newHeight);
      
      setDragPosition({ top: newTop, height: newHeight, dayIndex: newDayIndex });
    };

    const handleMouseUp = () => {
      if (dragState && dragPosition) {
        // Convert to time
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
        "bg-card rounded-2xl border border-border/50 overflow-hidden select-none",
        dragState && "cursor-grabbing"
      )}
    >
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
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;
