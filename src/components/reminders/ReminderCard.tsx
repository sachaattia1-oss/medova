import { format, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock, CalendarDays } from "lucide-react";
import type { Reminder } from "@/pages/DashboardReminders";

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  isOverdue?: boolean;
}

const ReminderCard = ({ reminder, onToggle, onEdit, onDelete, isOverdue }: ReminderCardProps) => {
  const dateStr = format(parseISO(reminder.reminder_date), "EEEE d MMMM yyyy", { locale: fr });
  const isReminderToday = isToday(parseISO(reminder.reminder_date));

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        reminder.is_completed
          ? "bg-muted/50 border-border/30 opacity-70"
          : isOverdue
          ? "bg-destructive/5 border-destructive/20"
          : isReminderToday
          ? "bg-accent/5 border-accent/20"
          : "bg-card border-border/50 hover:border-border"
      }`}
    >
      <div
        className="w-1 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: reminder.color }}
      />

      <Checkbox
        checked={reminder.is_completed}
        onCheckedChange={(checked) => onToggle(reminder.id, !!checked)}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${reminder.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {reminder.title}
        </h3>
        {reminder.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{reminder.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {isReminderToday ? "Aujourd'hui" : dateStr}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {reminder.reminder_time.slice(0, 5)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(reminder)}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(reminder.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ReminderCard;
