-- Create table for info cards in video sections
CREATE TABLE IF NOT EXISTS grade11_video_info_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  grade_level TEXT NOT NULL DEFAULT '11',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE grade11_video_info_cards ENABLE ROW LEVEL SECURITY;

-- Policies for viewing
CREATE POLICY "Anyone can view active info cards"
ON grade11_video_info_cards
FOR SELECT
USING (is_active = true);

-- Policies for superadmin management
CREATE POLICY "Superadmins can manage info cards"
ON grade11_video_info_cards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_grade11_video_info_cards_updated_at
BEFORE UPDATE ON grade11_video_info_cards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default card
INSERT INTO grade11_video_info_cards (title, description, grade_level, order_index)
VALUES (
  'نموذج OSI - الطبقات السبع',
  'أمامك سلسلة فيديوهات تشرح نموذج OSI بطبقاته السبع. مناسبة لك إذا أردت تقوية معلوماتك. نشرح خطوة بخطوة وظيفة كل طبقة والأجهزة التي تعمل فيها.',
  '11',
  0
);