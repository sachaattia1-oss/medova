-- Add tutor-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_tutor_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tutor_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tutor_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tutor_approved_by UUID;

-- Create a security definer function to check if a tutor is approved
CREATE OR REPLACE FUNCTION public.is_approved_tutor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = 'tutor'
      AND p.is_tutor_approved = true
  )
$$;

-- Update RLS policy for profiles to allow approved tutors to view student profiles
CREATE POLICY "Approved tutors can view student profiles"
ON public.profiles
FOR SELECT
USING (
  is_approved_tutor(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = profiles.user_id AND role = 'user'
  )
);

-- Allow tutors to manage courses if they are approved
CREATE POLICY "Approved tutors can manage courses"
ON public.courses
FOR ALL
USING (is_approved_tutor(auth.uid()));

-- Allow tutors to manage quizzes
CREATE POLICY "Approved tutors can manage quizzes"
ON public.quizzes
FOR ALL
USING (is_approved_tutor(auth.uid()));

-- Allow tutors to manage quiz questions
CREATE POLICY "Approved tutors can manage quiz questions"
ON public.quiz_questions
FOR ALL
USING (is_approved_tutor(auth.uid()));

-- Allow tutors to manage quiz answers
CREATE POLICY "Approved tutors can manage quiz answers"
ON public.quiz_answers
FOR ALL
USING (is_approved_tutor(auth.uid()));

-- Allow tutors to view all quiz attempts (to see student progress)
CREATE POLICY "Approved tutors can view all quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (is_approved_tutor(auth.uid()));

-- Allow tutors to view and respond to all conversations
CREATE POLICY "Approved tutors can view all conversations"
ON public.conversations
FOR SELECT
USING (is_approved_tutor(auth.uid()));

CREATE POLICY "Approved tutors can update all conversations"
ON public.conversations
FOR UPDATE
USING (is_approved_tutor(auth.uid()));

-- Allow tutors to view and send messages in all conversations
CREATE POLICY "Approved tutors can view all messages"
ON public.messages
FOR SELECT
USING (is_approved_tutor(auth.uid()));

CREATE POLICY "Approved tutors can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  is_approved_tutor(auth.uid())
  AND sender_id = auth.uid()
);