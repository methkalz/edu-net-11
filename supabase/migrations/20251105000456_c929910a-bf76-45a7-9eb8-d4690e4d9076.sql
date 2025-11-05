-- تنظيف البيانات القديمة: تحويل النسب من 0-100 إلى 0.0-1.0
-- هذا يصلح البيانات القديمة التي كانت تُخزن بنسب مئوية مباشرة

-- تحديث max_similarity_score
UPDATE public.pdf_comparison_results 
SET max_similarity_score = max_similarity_score / 100
WHERE max_similarity_score > 1.0;

-- تحديث avg_similarity_score
UPDATE public.pdf_comparison_results 
SET avg_similarity_score = avg_similarity_score / 100
WHERE avg_similarity_score > 1.0;

-- تحديث similarity_score في matches (JSONB array)
UPDATE public.pdf_comparison_results
SET matches = (
  SELECT jsonb_agg(
    CASE 
      WHEN (match->>'similarity_score')::numeric > 1.0 
      THEN jsonb_set(match, '{similarity_score}', to_jsonb((match->>'similarity_score')::numeric / 100))
      ELSE match
    END
  )
  FROM jsonb_array_elements(matches) AS match
)
WHERE EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(matches) AS match
  WHERE (match->>'similarity_score')::numeric > 1.0
);

-- تحديث cosine_score في matches
UPDATE public.pdf_comparison_results
SET matches = (
  SELECT jsonb_agg(
    CASE 
      WHEN (match->>'cosine_score')::numeric > 1.0 
      THEN jsonb_set(match, '{cosine_score}', to_jsonb((match->>'cosine_score')::numeric / 100))
      ELSE match
    END
  )
  FROM jsonb_array_elements(matches) AS match
)
WHERE EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(matches) AS match
  WHERE match->>'cosine_score' IS NOT NULL AND (match->>'cosine_score')::numeric > 1.0
);

-- تحديث jaccard_score في matches
UPDATE public.pdf_comparison_results
SET matches = (
  SELECT jsonb_agg(
    CASE 
      WHEN (match->>'jaccard_score')::numeric > 1.0 
      THEN jsonb_set(match, '{jaccard_score}', to_jsonb((match->>'jaccard_score')::numeric / 100))
      ELSE match
    END
  )
  FROM jsonb_array_elements(matches) AS match
)
WHERE EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(matches) AS match
  WHERE match->>'jaccard_score' IS NOT NULL AND (match->>'jaccard_score')::numeric > 1.0
);