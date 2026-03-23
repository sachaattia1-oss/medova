import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import CourseCard from "@/components/dashboard/CourseCard";
import { BookOpen, GraduationCap, Calendar, Clock, Bell, CalendarDays, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isAfter, isToday, isBefore, startOfDay, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_free: boolean | null;
  thumbnail_url: string | null;
}

interface QuizAttempt {
  id: string;
  score: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
}

interface ScheduleEvent {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
  start_date: string;
  recurrence_type: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string;
  is_completed: boolean;
  color: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isApprovedTutor, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect tutors to their dashboard
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      if (isApprovedTutor && !isAdmin) {
        navigate("/tutor");
      }
    }
  }, [user, authLoading, roleLoading, isApprovedTutor, isAdmin, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch courses count
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, description, category, is_free, thumbnail_url")
          .order("order_index", { ascending: true })
          .limit(6);

        if (coursesData) setCourses(coursesData);

        // Fetch user's quiz attempts
        const { data: attemptsData } = await supabase
          .from("quiz_attempts")
          .select("id, score, total_questions, time_spent_seconds")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (attemptsData) setQuizAttempts(attemptsData);

        // Fetch schedule events
        const { data: eventsData } = await supabase
          .from("schedule_events")
          .select("id, title, day_of_week, start_time, end_time, color, start_date, recurrence_type")
          .order("start_time");

        if (eventsData) setScheduleEvents(eventsData);

        // Fetch upcoming reminders
        const { data: remindersData } = await supabase
          .from("reminders")
          .select("id, title, description, reminder_date, reminder_time, is_completed, color")
          .eq("is_completed", false)
          .order("reminder_date")
          .order("reminder_time")
          .limit(5);

        if (remindersData) setReminders(remindersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate stats
  const totalQuizzes = quizAttempts.length;
  const averageScore = quizAttempts.length > 0
    ? Math.round(
        quizAttempts.reduce((acc, a) => {
          if (a.score !== null && a.total_questions !== null && a.total_questions > 0) {
            return acc + (a.score / a.total_questions) * 100;
          }
          return acc;
        }, 0) / quizAttempts.length
      )
    : 0;
  const totalTime = quizAttempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);
  const totalHours = Math.floor(totalTime / 3600);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="ml-64 p-8">
        <DashboardHeader 
          title="Tableau de bord" 
          description="Bienvenue ! Voici un aperçu de ta progression."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Cours disponibles"
            value={courses.length}
            icon={BookOpen}
            onClick={() => navigate("/dashboard/cours")}
          />
          <StatsCard
            title="QCM complétés"
            value={totalQuizzes}
            icon={GraduationCap}
            trend={totalQuizzes > 0 ? { value: 12, isPositive: true } : undefined}
            onClick={() => navigate("/dashboard/qcm")}
          />
          <StatsCard
            title="Emploi du temps"
            value=""
            icon={Calendar}
            onClick={() => navigate("/dashboard/emploi-du-temps")}
          />
        </div>

        {/* Schedule & Reminders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Emploi du temps - Aujourd'hui
              </CardTitle>
              <button
                onClick={() => navigate("/dashboard/emploi-du-temps")}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : todayEvents.length > 0 ? (
                <div className="space-y-2">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/dashboard/emploi-du-temps")}
                    >
                      <div
                        className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun événement aujourd'hui</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Rappels à faire
              </CardTitle>
              <button
                onClick={() => navigate("/dashboard/rappels")}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : reminders.length > 0 ? (
                <div className="space-y-2">
                  {reminders.map((reminder) => {
                    const reminderDate = parseISO(reminder.reminder_date);
                    const isOverdue = isBefore(reminderDate, startOfDay(new Date())) && !isToday(reminderDate);
                    const isTodayReminder = isToday(reminderDate);

                    return (
                      <div
                        key={reminder.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isOverdue
                            ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                            : isTodayReminder
                            ? "bg-accent/5 border-accent/20 hover:bg-accent/10"
                            : "border-border/50 bg-muted/30 hover:bg-muted/50"
                        }`}
                        onClick={() => navigate("/dashboard/rappels")}
                      >
                        <div
                          className="w-1 h-10 rounded-full flex-shrink-0"
                          style={{ backgroundColor: reminder.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{reminder.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {isTodayReminder
                              ? "Aujourd'hui"
                              : isOverdue
                              ? "En retard"
                              : format(reminderDate, "d MMM", { locale: fr })}
                            <Clock className="w-3.5 h-3.5 ml-1" />
                            {reminder.reminder_time.slice(0, 5)}
                          </div>
                        </div>
                        {isOverdue && (
                          <span className="text-xs text-destructive font-medium px-2 py-0.5 bg-destructive/10 rounded-full">
                            En retard
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun rappel en attente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
