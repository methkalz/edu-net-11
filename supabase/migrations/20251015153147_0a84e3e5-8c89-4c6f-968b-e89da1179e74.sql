-- Create storage bucket for grade 11 video thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('grade11_thumbnails', 'grade11_thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for grade11_thumbnails bucket
CREATE POLICY "Anyone can view grade 11 thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'grade11_thumbnails');

CREATE POLICY "Authenticated users can upload grade 11 thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'grade11_thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'grade11_thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'grade11_thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);