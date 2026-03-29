ALTER TABLE public.quiz_questions 
ADD COLUMN is_annale boolean NOT NULL DEFAULT false,
ADD COLUMN annale_year integer;