-- Update the source_type constraint to include 'drive'
ALTER TABLE grade11_videos 
DROP CONSTRAINT IF EXISTS grade11_videos_source_type_check;

ALTER TABLE grade11_videos 
ADD CONSTRAINT grade11_videos_source_type_check 
CHECK (source_type IN ('youtube', 'vimeo', 'drive', 'direct'));