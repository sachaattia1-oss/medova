
-- Create annales table
CREATE TABLE public.annales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  year integer NOT NULL,
  category_id uuid REFERENCES public.course_categories(id),
  pdf_url text,
  quiz_id uuid REFERENCES public.quizzes(id),
  target_audience text NOT NULL DEFAULT 'all',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.annales ENABLE ROW LEVEL SECURITY;

-- Anyone can view annales
CREATE POLICY "Anyone can view annales" ON public.annales
  FOR SELECT TO authenticated USING (true);

-- Admins can manage all annales
CREATE POLICY "Admins can manage annales" ON public.annales
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Tutors can create annales
CREATE POLICY "Tutors can create annales" ON public.annales
  FOR INSERT TO authenticated
  WITH CHECK (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can update own annales
CREATE POLICY "Tutors can update own annales" ON public.annales
  FOR UPDATE TO authenticated
  USING (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Tutors can delete own annales
CREATE POLICY "Tutors can delete own annales" ON public.annales
  FOR DELETE TO authenticated
  USING (is_approved_tutor(auth.uid()) AND created_by = auth.uid());

-- Create storage bucket for annales PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('annales-pdfs', 'annales-pdfs', true);

-- Storage policies for annales-pdfs bucket
CREATE POLICY "Anyone can view annales pdfs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'annales-pdfs');

CREATE POLICY "Admins can manage annales pdfs" ON storage.objects
  FOR ALL TO public USING (bucket_id = 'annales-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tutors can upload annales pdfs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'annales-pdfs' AND is_approved_tutor(auth.uid()));

CREATE POLICY "Tutors can delete own annales pdfs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'annales-pdfs' AND is_approved_tutor(auth.uid()));

-- Update trigger for updated_at
CREATE TRIGGER update_annales_updated_at
  BEFORE UPDATE ON public.annales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
