-- Add category_id foreign key to courses table
ALTER TABLE public.courses 
ADD COLUMN category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_courses_category_id ON public.courses(category_id);