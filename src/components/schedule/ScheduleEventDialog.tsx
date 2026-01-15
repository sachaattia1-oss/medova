import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScheduleEvent } from "@/pages/DashboardSchedule";

const DAYS = [
  { value: "0", label: "Lundi" },
  { value: "1", label: "Mardi" },
  { value: "2", label: "Mercredi" },
  { value: "3", label: "Jeudi" },
  { value: "4", label: "Vendredi" },
  { value: "5", label: "Samedi" },
  { value: "6", label: "Dimanche" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Pas de répétition" },
  { value: "weekly", label: "Chaque semaine" },
  { value: "biweekly", label: "Toutes les 2 semaines" },
  { value: "monthly", label: "Chaque mois (même jour)" },
];

const COLORS = [
  { value: "#3b82f6", label: "Bleu" },
  { value: "#22c55e", label: "Vert" },
  { value: "#eab308", label: "Jaune" },
  { value: "#f97316", label: "Orange" },
  { value: "#ef4444", label: "Rouge" },
  { value: "#a855f7", label: "Violet" },
  { value: "#ec4899", label: "Rose" },
  { value: "#06b6d4", label: "Cyan" },
];

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(100),
  description: z.string().max(500).optional(),
  day_of_week: z.string(),
  start_time: z.string().min(1, "L'heure de début est requise"),
  end_time: z.string().min(1, "L'heure de fin est requise"),
  color: z.string(),
  start_date: z.string().min(1, "La date de début est requise"),
  recurrence_type: z.string(),
  recurrence_end_date: z.string().optional(),
}).refine((data) => {
  const start = data.start_time;
  const end = data.end_time;
  return start < end;
}, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ["end_time"],
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent | null;
  onEventSaved: () => void;
  defaultDate?: Date;
}

const ScheduleEventDialog = ({
  open,
  onOpenChange,
  event,
  onEventSaved,
  defaultDate = new Date(),
}: ScheduleEventDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      day_of_week: "0",
      start_time: "09:00",
      end_time: "10:00",
      color: "#3b82f6",
      start_date: format(new Date(), "yyyy-MM-dd"),
      recurrence_type: "none",
      recurrence_end_date: "",
    },
  });

  const watchRecurrenceType = form.watch("recurrence_type");

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        day_of_week: event.day_of_week.toString(),
        start_time: event.start_time.slice(0, 5),
        end_time: event.end_time.slice(0, 5),
        color: event.color,
        start_date: event.start_date,
        recurrence_type: event.recurrence_type || "none",
        recurrence_end_date: event.recurrence_end_date || "",
      });
    } else {
      const dayOfWeek = (defaultDate.getDay() + 6) % 7; // Convert to Monday = 0
      form.reset({
        title: "",
        description: "",
        day_of_week: dayOfWeek.toString(),
        start_time: "09:00",
        end_time: "10:00",
        color: "#3b82f6",
        start_date: format(defaultDate, "yyyy-MM-dd"),
        recurrence_type: "none",
        recurrence_end_date: "",
      });
    }
  }, [event, open, form, defaultDate]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    try {
      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        day_of_week: parseInt(data.day_of_week),
        start_time: data.start_time,
        end_time: data.end_time,
        color: data.color,
        start_date: data.start_date,
        recurrence_type: data.recurrence_type,
        recurrence_end_date: data.recurrence_end_date || null,
      };

      if (event) {
        const { error } = await supabase
          .from("schedule_events")
          .update(eventData)
          .eq("id", event.id);

        if (error) throw error;

        toast({
          title: "Événement modifié",
          description: "L'événement a été mis à jour",
        });
      } else {
        const { error } = await supabase
          .from("schedule_events")
          .insert(eventData);

        if (error) throw error;

        toast({
          title: "Événement créé",
          description: "L'événement a été ajouté à votre emploi du temps",
        });
      }

      onEventSaved();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'événement",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l'événement" : "Nouvel événement"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Révision Blueprint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes supplémentaires..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jour</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un jour" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de début</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recurrence_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Répétition</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choisissez si l'événement doit se répéter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchRecurrenceType !== "none" && (
              <FormField
                control={form.control}
                name="recurrence_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin de la répétition (optionnel)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Laissez vide pour une répétition sans fin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          field.value === color.value
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {event ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleEventDialog;
