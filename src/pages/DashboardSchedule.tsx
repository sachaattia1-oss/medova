import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WeeklySchedule from "@/components/schedule/WeeklySchedule";
import ScheduleEventDialog from "@/components/schedule/ScheduleEventDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";

export interface ScheduleEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

const DashboardSchedule = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

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

  const handleEventSaved = () => {
    fetchEvents();
    setDialogOpen(false);
    setEditingEvent(null);
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
          <div className="flex items-center justify-end mb-8">
            <Button onClick={handleAddEvent} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un événement
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <WeeklySchedule
              events={events}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          <ScheduleEventDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            event={editingEvent}
            onEventSaved={handleEventSaved}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardSchedule;
