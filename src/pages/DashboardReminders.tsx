import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReminderCard from "@/components/reminders/ReminderCard";
import ReminderDialog from "@/components/reminders/ReminderDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { isAfter, isBefore, isToday, parseISO, startOfDay } from "date-fns";

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string;
  is_completed: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

const DashboardReminders = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    if (user) fetchReminders();
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("reminder_date")
        .order("reminder_time");
      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast({ title: "Erreur", description: "Impossible de charger les rappels", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("reminders").update({ is_completed: completed }).eq("id", id);
      if (error) throw error;
      setReminders(reminders.map((r) => (r.id === id ? { ...r, is_completed: completed } : r)));
      toast({ title: completed ? "Rappel terminé" : "Rappel réactivé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de modifier le rappel", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
      setReminders(reminders.filter((r) => r.id !== id));
      toast({ title: "Rappel supprimé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le rappel", variant: "destructive" });
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingReminder(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    fetchReminders();
    setDialogOpen(false);
    setEditingReminder(null);
  };

  const today = startOfDay(new Date());
  const upcoming = reminders.filter((r) => !r.is_completed && !isBefore(parseISO(r.reminder_date), today));
  const overdue = reminders.filter((r) => !r.is_completed && isBefore(parseISO(r.reminder_date), today) && !isToday(parseISO(r.reminder_date)));
  const completed = reminders.filter((r) => r.is_completed);
  const todayReminders = reminders.filter((r) => !r.is_completed && isToday(parseISO(r.reminder_date)));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <DashboardHeader title="Rappels" description="Programmez vos rappels de révisions" />
        <main className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              {todayReminders.length > 0 && (
                <p className="text-sm text-accent font-medium">
                  🔔 {todayReminders.length} rappel(s) aujourd'hui
                </p>
              )}
              {overdue.length > 0 && (
                <p className="text-sm text-destructive font-medium">
                  ⚠️ {overdue.length} rappel(s) en retard
                </p>
              )}
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau rappel
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  À venir ({upcoming.length})
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  En retard ({overdue.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Terminés ({completed.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {upcoming.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">Aucun rappel à venir</p>
                    <p className="text-sm mt-1">Créez un rappel pour ne rien oublier !</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {upcoming.map((r) => (
                      <ReminderCard key={r.id} reminder={r} onToggle={handleToggleComplete} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="overdue">
                {overdue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">Aucun rappel en retard 🎉</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {overdue.map((r) => (
                      <ReminderCard key={r.id} reminder={r} onToggle={handleToggleComplete} onEdit={handleEdit} onDelete={handleDelete} isOverdue />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completed.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">Aucun rappel terminé</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {completed.map((r) => (
                      <ReminderCard key={r.id} reminder={r} onToggle={handleToggleComplete} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <ReminderDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            reminder={editingReminder}
            onSaved={handleSaved}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardReminders;
