import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Reminder } from "@/pages/DashboardReminders";

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
  reminder_date: z.string().min(1, "La date est requise"),
  reminder_time: z.string().min(1, "L'heure est requise"),
  color: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
  onSaved: () => void;
}

const ReminderDialog = ({ open, onOpenChange, reminder, onSaved }: ReminderDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      reminder_date: format(new Date(), "yyyy-MM-dd"),
      reminder_time: "09:00",
      color: "#3b82f6",
    },
  });

  useEffect(() => {
    if (reminder) {
      form.reset({
        title: reminder.title,
        description: reminder.description || "",
        reminder_date: reminder.reminder_date,
        reminder_time: reminder.reminder_time.slice(0, 5),
        color: reminder.color,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        reminder_date: format(new Date(), "yyyy-MM-dd"),
        reminder_time: "09:00",
        color: "#3b82f6",
      });
    }
  }, [reminder, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const payload = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        reminder_date: data.reminder_date,
        reminder_time: data.reminder_time,
        color: data.color,
      };

      if (reminder) {
        const { error } = await supabase.from("reminders").update(payload).eq("id", reminder.id);
        if (error) throw error;
        toast({ title: "Rappel modifié" });
      } else {
        const { error } = await supabase.from("reminders").insert(payload);
        if (error) throw error;
        toast({ title: "Rappel créé", description: "Votre rappel a été programmé" });
      }
      onSaved();
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder le rappel", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{reminder ? "Modifier le rappel" : "Nouveau rappel"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl><Input placeholder="Ex: Réviser le chapitre 3" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optionnel)</FormLabel>
                <FormControl><Textarea placeholder="Notes supplémentaires..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="reminder_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="reminder_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>Couleur</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => field.onChange(color.value)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        field.value === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit">{reminder ? "Modifier" : "Créer"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
