
-- Update quiz_questions: tutors can only manage questions in their own quizzes
DROP POLICY IF EXISTS "Approved tutors can manage quiz questions" ON public.quiz_questions;

CREATE POLICY "Tutors can insert own quiz questions"
ON public.quiz_questions FOR INSERT
TO authenticated
WITH CHECK (
  is_approved_tutor(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid())
);

CREATE POLICY "Tutors can update own quiz questions"
ON public.quiz_questions FOR UPDATE
TO authenticated
USING (
  is_approved_tutor(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid())
);

CREATE POLICY "Tutors can delete own quiz questions"
ON public.quiz_questions FOR DELETE
TO authenticated
USING (
  is_approved_tutor(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid())
);

-- Update quiz_answers: tutors can only manage answers in their own quizzes
DROP POLICY IF EXISTS "Approved tutors can manage quiz answers" ON public.quiz_answers;

CREATE POLICY "Tutors can insert own quiz answers"
ON public.quiz_answers FOR INSERT
TO authenticated
WITH CHECK (
  is_approved_tutor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND q.created_by = auth.uid()
  )
);

CREATE POLICY "Tutors can update own quiz answers"
ON public.quiz_answers FOR UPDATE
TO authenticated
USING (
  is_approved_tutor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND q.created_by = auth.uid()
  )
);

CREATE POLICY "Tutors can delete own quiz answers"
ON public.quiz_answers FOR DELETE
TO authenticated
USING (
  is_approved_tutor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND q.created_by = auth.uid()
  )
);

-- Also update quiz_answers SELECT for tutors to see answers of their own quizzes
DROP POLICY IF EXISTS "Students can view answers through view only" ON public.quiz_answers;

CREATE POLICY "Admins and tutors can view quiz answers"
ON public.quiz_answers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (is_approved_tutor(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND q.created_by = auth.uid()
  ))
);
