-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public)
VALUES ('grade10-3d-models', 'grade10-3d-models', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for 3D models bucket
CREATE POLICY "Anyone can view 3D model files"
ON storage.objects FOR SELECT
USING (bucket_id = 'grade10-3d-models');

CREATE POLICY "Authenticated users can upload 3D model files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'grade10-3d-models' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Owners can update their 3D model files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'grade10-3d-models' AND
  auth.uid() = owner
);

CREATE POLICY "Owners can delete their 3D model files"  
ON storage.objects FOR DELETE
USING (
  bucket_id = 'grade10-3d-models' AND
  auth.uid() = owner
);