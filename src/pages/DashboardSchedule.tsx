import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WeeklySchedule from "@/components/schedule/WeeklySchedule";
import DailySchedule from "@/components/schedule/DailySchedule";
import ScheduleEventDialog from "@/components/schedule/ScheduleEventDialog";
import ScheduleNavigation from "@/components/schedule/ScheduleNavigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { startOfWeek, addWeeks, addDays, format, isSameDay, isAfter, isBefore, differenceInWeeks } from "date-fns";
import { fr } from "date-fns/locale";

export interface ScheduleEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
  recurrence_type: string;
  recurrence_end_date: string | null;
  start_date: string;
}

export type ViewMode = "week" | "day";

const DashboardSchedule = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("schedule_events")
        .select("*")
        .order("start_time");

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'emploi du temps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if an event should appear on a given date
  const isEventOnDate = (event: ScheduleEvent, date: Date): boolean => {
    const eventStartDate = new Date(event.start_date);
    const eventDayOfWeek = event.day_of_week;
    const dateDayOfWeek = (date.getDay() + 6) % 7; // Convert to Monday = 0

    // Check if it's the right day of the week
    if (eventDayOfWeek !== dateDayOfWeek) return false;

    // Check if the date is before the event start date
    if (isBefore(date, eventStartDate)) return false;

    // Check recurrence
    if (event.recurrence_type === "none") {
      return isSameDay(date, eventStartDate);
    }

    // Check if past recurrence end date
    if (event.recurrence_end_date && isAfter(date, new Date(event.recurrence_end_date))) {
      return false;
    }

    const weeksDiff = differenceInWeeks(date, eventStartDate);

    switch (event.recurrence_type) {
      case "weekly":
        return weeksDiff >= 0;
      case "biweekly":
        return weeksDiff >= 0 && weeksDiff % 2 === 0;
      case "monthly":
        // Check if it's the same week number in the month
        const eventWeekOfMonth = Math.floor((eventStartDate.getDate() - 1) / 7);
        const dateWeekOfMonth = Math.floor((date.getDate() - 1) / 7);
        return eventWeekOfMonth === dateWeekOfMonth;
      default:
        return false;
    }
  };

  // Get events for a specific day in the current view
  const getEventsForDay = (dayIndex: number): ScheduleEvent[] => {
    const targetDate = addDays(weekStart, dayIndex);
    return events.filter((event) => isEventOnDate(event, targetDate));
  };

  // Get events for the current day (for day view)
  const getEventsForCurrentDay = (): ScheduleEvent[] => {
    return events.filter((event) => isEventOnDate(event, currentDate));
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("schedule_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      setEvents(events.filter((e) => e.id !== eventId));
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé de votre emploi du temps",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive",
      });
    }
  };

  const handleEventUpdate = async (eventId: string, updates: { 
    day_of_week?: number; 
    start_time?: string; 
    end_time?: string 
  }) => {
    try {
      const { error } = await supabase
        .from("schedule_events")
        .update(updates)
        .eq("id", eventId);

      if (error) throw error;

      // Update local state
      setEvents(events.map((e) => 
        e.id === eventId ? { ...e, ...updates } : e
      ));
      
      toast({
        title: "Événement modifié",
        description: "L'horaire a été mis à jour",
      });
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'événement",
        variant: "destructive",
      });
    }
  };

  const handleEventSaved = () => {
    fetchEvents();
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDayClick = (dayIndex: number) => {
    const targetDate = addDays(weekStart, dayIndex);
    setCurrentDate(targetDate);
    setViewMode("day");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader title="Emploi du Temps" description="Organisez votre semaine de révisions" />
        <main className="p-8">
          <div className="flex items-center justify-between mb-6">
            <ScheduleNavigation
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              currentDate={currentDate}
              weekStart={weekStart}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
            />
            <Button onClick={handleAddEvent} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un événement
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : viewMode === "week" ? (
            <WeeklySchedule
              events={events}
              getEventsForDay={getEventsForDay}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onDayClick={handleDayClick}
              onEventUpdate={handleEventUpdate}
            />
          ) : (
            <DailySchedule
              events={getEventsForCurrentDay()}
              currentDate={currentDate}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onEventUpdate={handleEventUpdate}
            />
          )}

          <ScheduleEventDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            event={editingEvent}
            onEventSaved={handleEventSaved}
            defaultDate={currentDate}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardSchedule;
