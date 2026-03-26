CREATE POLICY "Authenticated users can view quiz answers via public view"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (true);