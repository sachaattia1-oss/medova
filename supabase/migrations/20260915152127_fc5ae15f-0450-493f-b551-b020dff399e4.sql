ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS image_url text;

CREATE POLICY "Anyone can view question images" ON storage.objects
  FOR SELECT USING (bucket_id = 'question-images');

CREATE POLICY "Tutors and admins can upload question images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'question-images'
    AND (public.has_role(auth.uid(), 'admin') OR public.is_approved_tutor(auth.uid()))
  );

CREATE POLICY "Tutors and admins can update question images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'question-images'
    AND (public.has_role(auth.uid(), 'admin') OR public.is_approved_tutor(auth.uid()))
  );

CREATE POLICY "Tutors and admins can delete question images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'question-images'
    AND (public.has_role(auth.uid(), 'admin') OR public.is_approved_tutor(auth.uid()))
  );