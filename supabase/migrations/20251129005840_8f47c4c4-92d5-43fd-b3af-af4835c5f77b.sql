-- تحديث إعدادات مقارنة PDF لإضافة Coverage weights و thresholds
-- الهدف: إضافة algorithm_weights.coverage_weight و thresholds للـ Coverage

UPDATE pdf_comparison_settings
SET 
  algorithm_weights = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          algorithm_weights,
          '{cosine_weight}', '0.40'::jsonb
        ),
        '{jaccard_weight}', '0.30'::jsonb
      ),
      '{length_weight}', '0.05'::jsonb
    ),
    '{coverage_weight}', '0.25'::jsonb
  ),
  thresholds = jsonb_set(
    jsonb_set(
      jsonb_set(
        thresholds,
        '{coverage_high_threshold}', '25'::jsonb
      ),
      '{coverage_medium_threshold}', '15'::jsonb
    ),
    '{paragraph_similarity_min}', '75'::jsonb
  ),
  updated_at = now()
WHERE is_active = true;

-- عرض النتيجة للتأكد
SELECT 
  setting_name,
  algorithm_weights,
  thresholds,
  is_active,
  updated_at
FROM pdf_comparison_settings
WHERE is_active = true;