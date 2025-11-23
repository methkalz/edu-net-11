-- تعديل دالة match_documents_hybrid لدعم algorithm_weights الديناميكية
CREATE OR REPLACE FUNCTION match_documents_hybrid(
  query_embedding vector(1024),
  query_keywords jsonb,
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 10,
  excluded_ids uuid[] DEFAULT '{}',
  cosine_weight float DEFAULT 0.50,
  jaccard_weight float DEFAULT 0.40,
  length_weight float DEFAULT 0.10,
  target_page_count int DEFAULT NULL,
  target_word_count int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_path text,
  file_name text,
  original_file_name text,
  upload_date timestamptz,
  uploader_name text,
  grade_level text,
  word_count int,
  page_count int,
  similarity float,
  cosine_similarity float,
  jaccard_similarity float,
  length_similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_keywords_array text[];
  min_page_count int;
  max_page_count int;
  min_word_count_ratio float;
  max_word_count_ratio float;
BEGIN
  -- استخراج الكلمات المفتاحية من JSONB
  SELECT ARRAY(SELECT jsonb_array_elements_text(query_keywords))
  INTO query_keywords_array;

  -- حساب نطاقات التصفية البنيوية
  IF target_page_count IS NOT NULL THEN
    min_page_count := GREATEST(1, CAST(target_page_count * 0.7 AS int));
    max_page_count := CAST(target_page_count * 1.3 AS int);
  END IF;

  IF target_word_count IS NOT NULL THEN
    min_word_count_ratio := 0.5;
    max_word_count_ratio := 2.0;
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.file_path,
    c.file_name,
    c.original_file_name,
    c.upload_date,
    c.uploader_name,
    c.grade_level,
    c.word_count,
    c.page_count,
    -- حساب التشابه النهائي باستخدام الأوزان الديناميكية
    (
      (1 - (c.embedding <=> query_embedding)) * cosine_weight +
      (
        CASE 
          WHEN c.top_keywords IS NOT NULL AND jsonb_array_length(c.top_keywords) > 0 THEN
            (
              SELECT COUNT(DISTINCT keyword)::float / 
                     GREATEST(
                       (SELECT COUNT(DISTINCT k) FROM unnest(query_keywords_array) k),
                       (SELECT COUNT(DISTINCT jsonb_array_elements_text(c.top_keywords))
                     ), 1)
              FROM unnest(query_keywords_array) keyword
              WHERE keyword = ANY(
                SELECT jsonb_array_elements_text(c.top_keywords)
              )
            )
          ELSE 0
        END
      ) * jaccard_weight +
      (
        CASE
          WHEN target_word_count IS NOT NULL AND c.word_count IS NOT NULL THEN
            1.0 - ABS(c.word_count - target_word_count)::float / GREATEST(c.word_count, target_word_count, 1)
          ELSE 1.0
        END
      ) * length_weight
    ) as similarity,
    -- إرجاع المكونات الفردية للشفافية
    (1 - (c.embedding <=> query_embedding)) as cosine_similarity,
    (
      CASE 
        WHEN c.top_keywords IS NOT NULL AND jsonb_array_length(c.top_keywords) > 0 THEN
          (
            SELECT COUNT(DISTINCT keyword)::float / 
                   GREATEST(
                     (SELECT COUNT(DISTINCT k) FROM unnest(query_keywords_array) k),
                     (SELECT COUNT(DISTINCT jsonb_array_elements_text(c.top_keywords))
                   ), 1)
            FROM unnest(query_keywords_array) keyword
            WHERE keyword = ANY(
              SELECT jsonb_array_elements_text(c.top_keywords)
            )
          )
        ELSE 0
      END
    ) as jaccard_similarity,
    (
      CASE
        WHEN target_word_count IS NOT NULL AND c.word_count IS NOT NULL THEN
          1.0 - ABS(c.word_count - target_word_count)::float / GREATEST(c.word_count, target_word_count, 1)
        ELSE 1.0
      END
    ) as length_similarity
  FROM pdf_comparison_repository c
  WHERE 
    c.id != ALL(excluded_ids)
    AND c.embedding IS NOT NULL
    AND (target_page_count IS NULL OR (c.page_count >= min_page_count AND c.page_count <= max_page_count))
    AND (target_word_count IS NULL OR (
      c.word_count >= target_word_count * min_word_count_ratio 
      AND c.word_count <= target_word_count * max_word_count_ratio
    ))
    -- فلترة أولية بناءً على cosine similarity فقط
    AND (1 - (c.embedding <=> query_embedding)) >= (match_threshold * 0.7)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;