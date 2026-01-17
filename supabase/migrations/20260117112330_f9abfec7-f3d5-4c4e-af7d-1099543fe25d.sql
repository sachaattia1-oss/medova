-- Add course_id to quizzes table to link quizzes to courses
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);

-- Update quiz_attempts to store decimal scores for medical scoring
ALTER TABLE public.quiz_attempts ALTER COLUMN score TYPE NUMERIC(5,2) USING score::numeric(5,2);

-- Add column to store detailed answer data for review
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers_data JSONB;