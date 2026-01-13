-- Create storage bucket for course PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-pdfs', 'course-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to course PDFs
CREATE POLICY "Public read access for course PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-pdfs');

-- Allow authenticated users to upload (for admin)
CREATE POLICY "Admin upload access for course PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-pdfs' AND auth.role() = 'authenticated');