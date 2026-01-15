-- Create course_categories table for organizing courses
CREATE TABLE public.course_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" 
ON public.course_categories 
FOR SELECT 
USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" 
ON public.course_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the UE folders
INSERT INTO public.course_categories (name, order_index) VALUES
  ('UE1', 1),
  ('UE2', 2),
  ('UE3', 3),
  ('UE4', 4),
  ('UE7', 7),
  ('UE9', 9),
  ('UE10', 10);