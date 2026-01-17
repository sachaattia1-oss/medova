-- Drop existing permissive policies on quiz_answers
DROP POLICY IF EXISTS "Anyone can view quiz answers" ON public.quiz_answers;

-- Create a view for students that excludes is_correct
CREATE OR REPLACE VIEW public.quiz_answers_public
WITH (security_invoker = on) AS
  SELECT id, question_id, answer_text, order_index
  FROM public.quiz_answers;

-- Allow students to only read through the view (they won't see is_correct)
CREATE POLICY "Students can view answers through view only"
ON public.quiz_answers
FOR SELECT
USING (
  -- Admins and approved tutors can see is_correct
  has_role(auth.uid(), 'admin') OR is_approved_tutor(auth.uid())
);

-- Drop existing policy on quiz_attempts for users
DROP POLICY IF EXISTS "Users can manage own attempts" ON public.quiz_attempts;

-- Users can only view their own attempts (no direct insert - must go through edge function)
CREATE POLICY "Users can view own attempts"
ON public.quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all attempts
CREATE POLICY "Admins can manage all quiz attempts"
ON public.quiz_attempts
FOR ALL
USING (has_role(auth.uid(), 'admin'));