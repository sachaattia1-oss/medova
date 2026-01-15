-- Add recurrence fields to schedule_events table
ALTER TABLE public.schedule_events 
ADD COLUMN recurrence_type TEXT DEFAULT 'none' CHECK (recurrence_type IN ('none', 'weekly', 'biweekly', 'monthly')),
ADD COLUMN recurrence_end_date DATE,
ADD COLUMN start_date DATE NOT NULL DEFAULT CURRENT_DATE;