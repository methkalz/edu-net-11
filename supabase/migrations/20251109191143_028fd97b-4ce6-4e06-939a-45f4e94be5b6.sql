-- إضافة حقول جديدة لجدول pdf_comparison_results لدعم المقارنة الداخلية ومع المستودع

-- إضافة حقل batch_id لربط الملفات المرفوعة معاً
ALTER TABLE pdf_comparison_results 
ADD COLUMN IF NOT EXISTS batch_id uuid,
ADD COLUMN IF NOT EXISTS comparison_source text CHECK (comparison_source IN ('internal', 'repository', 'both')),
ADD COLUMN IF NOT EXISTS internal_matches jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS internal_max_similarity numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS internal_high_risk_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS repository_matches jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS repository_max_similarity numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS repository_high_risk_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS added_to_repository boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS repository_file_id uuid REFERENCES pdf_comparison_repository(id);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_pdf_comparison_results_batch_id ON pdf_comparison_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_pdf_comparison_results_comparison_source ON pdf_comparison_results(comparison_source);
CREATE INDEX IF NOT EXISTS idx_pdf_comparison_results_added_to_repository ON pdf_comparison_results(added_to_repository);

-- تحديث السجلات الموجودة
UPDATE pdf_comparison_results 
SET comparison_source = 'repository',
    repository_matches = COALESCE(matches, '[]'::jsonb),
    repository_max_similarity = COALESCE(max_similarity_score, 0),
    repository_high_risk_count = COALESCE(high_risk_matches, 0)
WHERE comparison_source IS NULL;