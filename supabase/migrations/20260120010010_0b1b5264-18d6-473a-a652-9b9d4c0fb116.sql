-- Create storage bucket for bagrut exam images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bagrut-exam-images', 'bagrut-exam-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access
CREATE POLICY "Public read access for bagrut images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bagrut-exam-images');

-- Policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload bagrut images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bagrut-exam-images' AND auth.role() = 'authenticated');

-- Policy for authenticated users to update their uploads
CREATE POLICY "Authenticated users can update bagrut images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bagrut-exam-images' AND auth.role() = 'authenticated');

-- Policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete bagrut images"
ON storage.objects FOR DELETE
USING (bucket_id = 'bagrut-exam-images' AND auth.role() = 'authenticated');