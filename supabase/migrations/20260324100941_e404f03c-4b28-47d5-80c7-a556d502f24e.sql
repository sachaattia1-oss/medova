ALTER TABLE public.courses ADD COLUMN target_audience text NOT NULL DEFAULT 'all';
ALTER TABLE public.quizzes ADD COLUMN target_audience text NOT NULL DEFAULT 'all';