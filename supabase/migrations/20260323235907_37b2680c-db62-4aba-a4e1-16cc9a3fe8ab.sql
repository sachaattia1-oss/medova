
-- Table for Q&A discussions on quiz questions
CREATE TABLE public.question_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.question_discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_discussions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view discussions (subscribers)
CREATE POLICY "Authenticated users can view discussions"
  ON public.question_discussions
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can post questions (parent_id IS NULL)
CREATE POLICY "Users can post questions"
  ON public.question_discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Approved tutors and admins can post replies
CREATE POLICY "Tutors and admins can reply"
  ON public.question_discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) AND 
    (parent_id IS NULL OR is_approved_tutor(auth.uid()) OR has_role(auth.uid(), 'admin'))
  );

-- Users can delete own posts
CREATE POLICY "Users can delete own discussions"
  ON public.question_discussions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
