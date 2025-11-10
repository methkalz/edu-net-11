-- ============================================
-- IMPROVE PDF COMPARISON ALGORITHM
-- Add top_keywords column and update match_documents_hybrid function
-- to use real Jaccard calculation
-- ============================================

-- Add top_keywords column to store extracted keywords for Jaccard similarity
ALTER TABLE public.pdf_comparison_repository 
ADD COLUMN IF NOT EXISTS top_keywords JSONB DEFAULT '[]'::jsonb;

-- Create index on top_keywords for faster queries
CREATE INDEX IF NOT EXISTS idx_pdf_repository_top_keywords 
ON public.pdf_comparison_repository USING GIN (top_keywords);

-- Drop old function
DROP FUNCTION IF EXISTS public.match_documents_hybrid(vector, integer, double precision, integer, text, text, double precision);

-- Create improved hybrid matching function with real Jaccard calculation
CREATE OR REPLACE FUNCTION public.match_documents_hybrid(
  query_embedding vector,
  query_keywords JSONB,
  match_threshold double precision DEFAULT 0.40,
  match_count integer DEFAULT 50,
  p_grade_level text DEFAULT NULL,
  p_project_type text DEFAULT NULL,
  jaccard_threshold double precision DEFAULT 0.25,
  p_page_count integer DEFAULT NULL,
  p_word_count integer DEFAULT NULL
) RETURNS TABLE(
  id uuid,
  file_name text,
  file_path text,
  grade_level text,
  project_type text,
  similarity double precision,
  jaccard_similarity double precision,
  word_count integer,
  uploaded_by uuid,
  school_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT 
      pcr.id,
      pcr.file_name,
      pcr.file_path,
      pcr.grade_level,
      pcr.project_type,
      pcr.word_count,
      pcr.uploaded_by,
      pcr.school_id,
      pcr.embedding,
      pcr.top_keywords,
      pcr.page_count,
      -- Calculate real Jaccard similarity using keyword overlap
      CASE 
        WHEN pcr.top_keywords IS NULL OR query_keywords IS NULL 
          OR jsonb_array_length(pcr.top_keywords) = 0 
          OR jsonb_array_length(query_keywords) = 0 
        THEN 0.0
        ELSE (
          SELECT COUNT(DISTINCT keyword)::float / (
            SELECT COUNT(DISTINCT all_keywords) 
            FROM (
              SELECT jsonb_array_elements_text(pcr.top_keywords) as all_keywords
              UNION
              SELECT jsonb_array_elements_text(query_keywords)
            ) union_set
          )
          FROM (
            SELECT jsonb_array_elements_text(pcr.top_keywords) as keyword
            INTERSECT
            SELECT jsonb_array_elements_text(query_keywords)
          ) intersection
        )
      END as real_jaccard
    FROM public.pdf_comparison_repository pcr
    WHERE pcr.embedding IS NOT NULL
      AND (p_grade_level IS NULL OR pcr.grade_level = p_grade_level)
      AND (p_project_type IS NULL OR pcr.project_type = p_project_type)
      -- Structural filters: page count (±30%)
      AND (
        p_page_count IS NULL 
        OR pcr.page_count IS NULL
        OR ABS(pcr.page_count - p_page_count)::float / GREATEST(pcr.page_count, p_page_count)::float <= 0.30
      )
      -- Structural filters: word count ratio (0.5 - 2.0)
      AND (
        p_word_count IS NULL 
        OR pcr.word_count IS NULL
        OR (pcr.word_count::float / GREATEST(p_word_count::float, 1)) BETWEEN 0.5 AND 2.0
      )
  )
  SELECT 
    c.id,
    c.file_name,
    c.file_path,
    c.grade_level,
    c.project_type,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.real_jaccard as jaccard_similarity,
    c.word_count,
    c.uploaded_by,
    c.school_id
  FROM candidates c
  WHERE c.real_jaccard >= jaccard_threshold
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.match_documents_hybrid IS 
'Hybrid document matching using:
1. Structural filters (page count, word count)
2. Real Jaccard similarity (keyword overlap)
3. Vector similarity (cosine distance with pgvector)
Default thresholds: match_threshold=0.40, jaccard_threshold=0.25';