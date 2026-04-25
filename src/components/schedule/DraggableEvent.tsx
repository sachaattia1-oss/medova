import { MouseEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, RotateCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScheduleEvent } from "@/pages/DashboardSchedule";

interface DraggableEventProps {
  event: ScheduleEvent;
  top: number;
  height: number;
  dayIndex: number;
  isDragging: boolean;
  dragPosition?: { top: number; height: number; dayIndex: number };
  onEditEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onDragStart: (
    e: MouseEvent,
    eventId: string,
    type: "move" | "resize-top" | "resize-bottom",
    top: number,
    height: number,
    dayIndex: number
  ) => void;
  compact?: boolean;
  index?: number;
}

const formatTime = (timeStr: string): string => timeStr.slice(0, 5);

const parseTime = (timeStr: string): number => {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
};

const formatDuration = (start: string, end: string): string => {
  const diff = parseTime(end) - parseTime(start);
  if (diff <= 0) return "";
  const h = Math.floor(diff);
  const m = Math.round((diff - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
};

// Convert hex to rgb for inline styling glows
const hexToRgb = (hex: string) => {
  const cleaned = hex.replace("#", "");
  const bigint = parseInt(cleaned.length === 3 ? cleaned.split("").map(c => c + c).join("") : cleaned, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const DraggableEvent = ({
  event,
  top,
  height,
  dayIndex,
  isDragging,
  dragPosition,
  onEditEvent,
  onDeleteEvent,
  onDragStart,
  compact = false,
  index = 0,
}: DraggableEventProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isRecurring = event.recurrence_type !== "none";
  const color = event.color || "#14b8a6";
  const { r, g, b } = hexToRgb(color);

  const displayTop = isDragging && dragPosition ? dragPosition.top : top;
  const displayHeight = isDragging && dragPosition ? dragPosition.height : height;
  const isBeingDragged = isDragging && dragPosition;
  const duration = formatDuration(event.start_time, event.end_time);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "absolute left-1 right-1 rounded-lg overflow-hidden cursor-grab group transition-all duration-300 backdrop-blur-md border animate-fade-in",
            isBeingDragged
              ? "cursor-grabbing z-50 scale-[1.02] opacity-95"
              : "hover:-translate-y-0.5 hover:scale-[1.01]"
          )}
          style={{
            top: `${displayTop}px`,
            height: `${Math.max(displayHeight, 30)}px`,
            background: `linear-gradient(135deg, rgba(${r},${g},${b},0.28), rgba(${r},${g},${b},0.18))`,
            borderColor: `rgba(${r},${g},${b},0.35)`,
            borderLeft: `3px solid ${color}`,
            boxShadow: isBeingDragged
              ? `0 12px 30px -6px rgba(${r},${g},${b},0.5)`
              : isHovered
              ? `0 8px 24px -4px rgba(${r},${g},${b},0.45), 0 0 0 1px rgba(${r},${g},${b},0.4)`
              : `0 2px 8px -2px rgba(${r},${g},${b},0.2)`,
            animationDelay: `${Math.min(index * 40, 300)}ms`,
            animationFillMode: "backwards",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            onDragStart(e, event.id, "move", top, height, dayIndex);
          }}
        >
          {/* Resize handle top */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-foreground/20 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart(e, event.id, "resize-top", top, height, dayIndex);
            }}
          />

          {/* Content */}
          <div className={cn("h-full flex flex-col", compact ? "px-2 py-1" : "px-2.5 py-1.5")}>
            <div className="flex items-center gap-1 min-w-0">
              <Clock
                className={cn(
                  "flex-shrink-0 text-foreground/70",
                  compact ? "w-2.5 h-2.5" : "w-3 h-3"
                )}
              />
              {isRecurring && (
                <RotateCw
                  className={cn(
                    "flex-shrink-0 text-foreground/70",
                    compact ? "w-2.5 h-2.5" : "w-3 h-3"
                  )}
                />
              )}
              <span
                className={cn(
                  "font-semibold truncate text-foreground",
                  compact ? "text-[10px]" : "text-xs"
                )}
              >
                {event.title}
              </span>
            </div>
            {displayHeight > 40 && (
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span
                  className={cn(
                    "text-foreground/70 font-medium",
                    compact ? "text-[9px]" : "text-[10px]"
                  )}
                >
                  {formatTime(event.start_time)} – {formatTime(event.end_time)}
                </span>
                {duration && displayHeight > 50 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full font-semibold text-foreground/90 flex-shrink-0",
                      compact ? "text-[8px]" : "text-[9px]"
                    )}
                    style={{
                      background: `rgba(${r},${g},${b},0.35)`,
                    }}
                  >
                    {duration}
                  </span>
                )}
              </div>
            )}
            {!compact && event.description && displayHeight > 80 && (
              <p className="text-foreground/65 text-[10px] mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          {/* Resize handle bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-foreground/20 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart(e, event.id, "resize-bottom", top, height, dayIndex);
            }}
          />

          {/* Action buttons on hover */}
          <div
            className={cn(
              "absolute top-1 right-1 hidden gap-1",
              isHovered && !isBeingDragged && "flex"
            )}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-5 w-5 bg-background/90 backdrop-blur hover:bg-background border border-border/50"
              onClick={(e) => {
                e.stopPropagation();
                onEditEvent(event);
              }}
            >
              <Pencil className="h-2.5 w-2.5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-5 w-5 bg-background/90 backdrop-blur hover:bg-destructive hover:text-destructive-foreground border border-border/50"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteEvent(event.id);
              }}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-popover/95 backdrop-blur-md border-border/60">
        <div className="space-y-1">
          <p className="font-semibold flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {event.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(event.start_time)} – {formatTime(event.end_time)}
            {duration && ` • ${duration}`}
          </p>
          {isRecurring && (
            <p className="text-xs text-accent">
              {event.recurrence_type === "weekly" && "Chaque semaine"}
              {event.recurrence_type === "biweekly" && "Toutes les 2 semaines"}
              {event.recurrence_type === "monthly" && "Chaque mois"}
            </p>
          )}
          {event.description && (
            <p className="text-xs max-w-[200px] text-muted-foreground">{event.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground/70 italic pt-1 border-t border-border/40 mt-1">
            Glissez pour déplacer • Bords pour redimensionner
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default DraggableEvent;
