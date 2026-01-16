import { useState, useCallback, useRef, MouseEvent } from "react";

interface DragState {
  eventId: string;
  type: "move" | "resize-top" | "resize-bottom";
  startY: number;
  startX: number;
  originalTop: number;
  originalHeight: number;
  originalDayIndex: number;
}

interface UseEventDragDropProps {
  pixelsPerHour: number;
  startHour: number;
  onEventUpdate: (eventId: string, updates: { 
    day_of_week?: number; 
    start_time?: string; 
    end_time?: string 
  }) => void;
}

const timeToString = (hours: number, minutes: number): string => {
  const h = Math.floor(hours);
  const m = Math.round(minutes);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
};

const roundToQuarter = (value: number): number => {
  return Math.round(value * 4) / 4;
};

export const useEventDragDrop = ({ pixelsPerHour, startHour, onEventUpdate }: UseEventDragDropProps) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const positionRef = useRef({ top: 0, height: 0, dayIndex: 0 });

  const startDrag = useCallback((
    e: MouseEvent,
    eventId: string,
    type: "move" | "resize-top" | "resize-bottom",
    currentTop: number,
    currentHeight: number,
    dayIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const state: DragState = {
      eventId,
      type,
      startY: e.clientY,
      startX: e.clientX,
      originalTop: currentTop,
      originalHeight: currentHeight,
      originalDayIndex: dayIndex,
    };
    
    dragRef.current = state;
    positionRef.current = { top: currentTop, height: currentHeight, dayIndex };
    setDragState(state);
    setIsDragging(true);
  }, []);

  const updateDrag = useCallback((e: MouseEvent, columnWidth: number) => {
    if (!dragRef.current) return null;
    
    const state = dragRef.current;
    const deltaY = e.clientY - state.startY;
    const deltaX = e.clientX - state.startX;
    
    let newTop = state.originalTop;
    let newHeight = state.originalHeight;
    let newDayIndex = state.originalDayIndex;
    
    if (state.type === "move") {
      newTop = state.originalTop + deltaY;
      // Calculate day change
      const dayDelta = Math.round(deltaX / columnWidth);
      newDayIndex = Math.max(0, Math.min(6, state.originalDayIndex + dayDelta));
    } else if (state.type === "resize-top") {
      const maxDelta = state.originalHeight - 15; // Minimum 15 minutes
      const constrainedDelta = Math.min(deltaY, maxDelta);
      newTop = state.originalTop + constrainedDelta;
      newHeight = state.originalHeight - constrainedDelta;
    } else if (state.type === "resize-bottom") {
      newHeight = Math.max(15, state.originalHeight + deltaY);
    }
    
    // Constrain to grid boundaries
    const maxTop = (21 - startHour) * pixelsPerHour - newHeight;
    newTop = Math.max(0, Math.min(maxTop, newTop));
    
    positionRef.current = { top: newTop, height: newHeight, dayIndex: newDayIndex };
    
    return { top: newTop, height: newHeight, dayIndex: newDayIndex };
  }, [pixelsPerHour, startHour]);

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;
    
    const state = dragRef.current;
    const pos = positionRef.current;
    
    // Convert pixel position to time
    const startHourValue = roundToQuarter(pos.top / pixelsPerHour + startHour);
    const durationHours = roundToQuarter(pos.height / pixelsPerHour);
    const endHourValue = startHourValue + durationHours;
    
    const startMinutes = (startHourValue % 1) * 60;
    const endMinutes = (endHourValue % 1) * 60;
    
    const updates: { day_of_week?: number; start_time?: string; end_time?: string } = {};
    
    if (state.type === "move") {
      updates.start_time = timeToString(startHourValue, startMinutes);
      updates.end_time = timeToString(endHourValue, endMinutes);
      if (pos.dayIndex !== state.originalDayIndex) {
        updates.day_of_week = pos.dayIndex;
      }
    } else if (state.type === "resize-top") {
      updates.start_time = timeToString(startHourValue, startMinutes);
    } else if (state.type === "resize-bottom") {
      updates.end_time = timeToString(endHourValue, endMinutes);
    }
    
    if (Object.keys(updates).length > 0) {
      onEventUpdate(state.eventId, updates);
    }
    
    dragRef.current = null;
    setDragState(null);
    setIsDragging(false);
  }, [pixelsPerHour, startHour, onEventUpdate]);

  const cancelDrag = useCallback(() => {
    dragRef.current = null;
    setDragState(null);
    setIsDragging(false);
  }, []);

  return {
    dragState,
    isDragging,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    currentPosition: positionRef.current,
  };
};
