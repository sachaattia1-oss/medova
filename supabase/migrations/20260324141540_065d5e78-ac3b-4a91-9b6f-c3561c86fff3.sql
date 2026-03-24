
-- Add created_by column to courses and quizzes
ALTER TABLE public.courses ADD COLUMN created_by uuid;
ALTER TABLE public.quizzes ADD COLUMN created_by uuid;

-- Drop existing tutor policies on courses
DROP POLICY IF EXISTS "Approved tutors can manage courses" ON public.courses;

-- Tutors can INSERT courses (setting created_by to their own id)
CREATE POLICY "Tutors can create courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can UPDATE only their own courses
CREATE POLICY "Tutors can update own courses"
ON public.courses FOR UPDATE
TO authenticated
USING (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can DELETE only their own courses
CREATE POLICY "Tutors can delete own courses"
ON public.courses FOR DELETE
TO authenticated
USING (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can SELECT all courses (needed to browse)
CREATE POLICY "Tutors can view all courses"
ON public.courses FOR SELECT
TO authenticated
USING (is_approved_tutor(auth.uid()));

-- Drop existing tutor policies on quizzes
DROP POLICY IF EXISTS "Approved tutors can manage quizzes" ON public.quizzes;

-- Tutors can INSERT quizzes
CREATE POLICY "Tutors can create quizzes"
ON public.quizzes FOR INSERT
TO authenticated
WITH CHECK (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can UPDATE only their own quizzes
CREATE POLICY "Tutors can update own quizzes"
ON public.quizzes FOR UPDATE
TO authenticated
USING (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can DELETE only their own quizzes
CREATE POLICY "Tutors can delete own quizzes"
ON public.quizzes FOR DELETE
TO authenticated
USING (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can SELECT all quizzes
CREATE POLICY "Tutors can view all quizzes"
ON public.quizzes FOR SELECT
TO authenticated
USING (is_approved_tutor(auth.uid()));
