-- Add video_category column to grade10_videos table
ALTER TABLE grade10_videos ADD COLUMN video_category text DEFAULT 'educational_explanations';

-- Add check constraint for valid video categories
ALTER TABLE grade10_videos ADD CONSTRAINT grade10_videos_category_check 
  CHECK (video_category IN ('educational_explanations', 'windows_basics'));

-- Update existing videos to be in educational_explanations category
UPDATE grade10_videos SET video_category = 'educational_explanations' WHERE video_category IS NULL OR video_category = 'educational_explanations';

-- Add comment for documentation
COMMENT ON COLUMN grade10_videos.video_category IS 'Category for organizing Grade 10 videos: educational_explanations or windows_basics';