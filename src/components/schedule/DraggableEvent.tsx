import { MouseEvent, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, RotateCw, GripVertical } from "lucide-react";
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
}

const formatTime = (timeStr: string): string => {
  return timeStr.slice(0, 5);
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
}: DraggableEventProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isRecurring = event.recurrence_type !== "none";
  
  const displayTop = isDragging && dragPosition ? dragPosition.top : top;
  const displayHeight = isDragging && dragPosition ? dragPosition.height : height;
  const isBeingDragged = isDragging && dragPosition;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "absolute left-1 right-1 rounded-lg overflow-hidden cursor-grab group transition-shadow",
            isBeingDragged && "cursor-grabbing z-50 shadow-xl opacity-90",
            !isBeingDragged && "hover:ring-2 hover:ring-primary/50 hover:shadow-lg"
          )}
          style={{
            top: `${displayTop}px`,
            height: `${Math.max(displayHeight, 30)}px`,
            backgroundColor: event.color || "#3b82f6",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={(e) => {
            // Don't start drag if clicking on buttons
            if ((e.target as HTMLElement).closest('button')) return;
            onDragStart(e, event.id, "move", top, height, dayIndex);
          }}
        >
          {/* Resize handle top */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/30 transition-opacity",
              isHovered && "opacity-50"
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart(e, event.id, "resize-top", top, height, dayIndex);
            }}
          />
          
          {/* Content */}
          <div className={cn("px-2 py-1 h-full flex flex-col", compact && "px-1")}>
            <div className="flex items-center gap-1">
              {!compact && (
                <GripVertical className="w-3 h-3 text-white/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {isRecurring && (
                <RotateCw className="w-3 h-3 text-white/80 flex-shrink-0" />
              )}
              <span className={cn(
                "text-white font-medium truncate",
                compact ? "text-[10px]" : "text-xs"
              )}>
                {event.title}
              </span>
            </div>
            {displayHeight > 40 && (
              <div className={cn(
                "text-white/80",
                compact ? "text-[9px]" : "text-[10px]"
              )}>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </div>
            )}
            {!compact && event.description && displayHeight > 80 && (
              <p className="text-white/70 text-[10px] mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
          
          {/* Resize handle bottom */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/30 transition-opacity",
              isHovered && "opacity-50"
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart(e, event.id, "resize-bottom", top, height, dayIndex);
            }}
          />
          
          {/* Action buttons on hover */}
          <div className={cn(
            "absolute top-1 right-1 hidden gap-1",
            isHovered && !isBeingDragged && "flex"
          )}>
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
          <p className="text-xs text-muted-foreground italic">
            Glissez pour déplacer • Tirez les bords pour redimensionner
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default DraggableEvent;
