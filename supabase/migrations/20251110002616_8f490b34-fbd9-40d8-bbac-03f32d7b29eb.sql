-- ============================================
-- Phase 1: Database Setup for pgvector-based PDF Comparison
-- ============================================

-- Enable pgvector extension for efficient vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (384 dimensions for TF-IDF vectors)
ALTER TABLE public.pdf_comparison_repository 
ADD COLUMN IF NOT EXISTS embedding vector(384),
ADD COLUMN IF NOT EXISTS word_set_size INTEGER;

-- Drop old unused columns to optimize storage
ALTER TABLE public.pdf_comparison_repository 
DROP COLUMN IF EXISTS text_embeddings,
DROP COLUMN IF EXISTS tfidf_vector;

-- Create HNSW index for ultra-fast similarity search
-- m=16: number of connections per layer (good balance of speed/accuracy)
-- ef_construction=64: size of dynamic candidate list during construction
CREATE INDEX IF NOT EXISTS pdf_repository_embedding_idx 
ON public.pdf_comparison_repository 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================
-- RPC Function: match_similar_documents
-- Fast cosine similarity search using pgvector
-- ============================================
CREATE OR REPLACE FUNCTION public.match_similar_documents(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.20,
  match_count int DEFAULT 50,
  p_grade_level text DEFAULT NULL,
  p_project_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_path text,
  grade_level text,
  project_type text,
  similarity float,
  word_count integer,
  uploaded_by uuid,
  school_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcr.id,
    pcr.file_name,
    pcr.file_path,
    pcr.grade_level,
    pcr.project_type,
    1 - (pcr.embedding <=> query_embedding) as similarity,
    pcr.word_count,
    pcr.uploaded_by,
    pcr.school_id
  FROM public.pdf_comparison_repository pcr
  WHERE pcr.embedding IS NOT NULL
    AND (p_grade_level IS NULL OR pcr.grade_level = p_grade_level)
    AND (p_project_type IS NULL OR pcr.project_type = p_project_type)
    AND 1 - (pcr.embedding <=> query_embedding) > match_threshold
  ORDER BY pcr.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- RPC Function: match_documents_hybrid
-- Two-phase screening: Fast word-set screening + Vector similarity
-- ============================================
CREATE OR REPLACE FUNCTION public.match_documents_hybrid(
  query_embedding vector(384),
  query_word_set_size integer,
  match_threshold float DEFAULT 0.20,
  match_count int DEFAULT 50,
  p_grade_level text DEFAULT NULL,
  p_project_type text DEFAULT NULL,
  jaccard_threshold float DEFAULT 0.10
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_path text,
  grade_level text,
  project_type text,
  similarity float,
  word_count integer,
  uploaded_by uuid,
  school_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      pcr.word_set_size,
      -- Approximate Jaccard similarity using word_set_size
      CASE 
        WHEN pcr.word_set_size IS NULL OR query_word_set_size IS NULL THEN 1.0
        ELSE 1.0 - (ABS(pcr.word_set_size - query_word_set_size)::float / 
                    GREATEST(pcr.word_set_size, query_word_set_size)::float)
      END as approx_jaccard
    FROM public.pdf_comparison_repository pcr
    WHERE pcr.embedding IS NOT NULL
      AND (p_grade_level IS NULL OR pcr.grade_level = p_grade_level)
      AND (p_project_type IS NULL OR pcr.project_type = p_project_type)
  )
  SELECT 
    c.id,
    c.file_name,
    c.file_path,
    c.grade_level,
    c.project_type,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.word_count,
    c.uploaded_by,
    c.school_id
  FROM candidates c
  WHERE c.approx_jaccard >= jaccard_threshold
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- Performance Logging Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.pdf_comparison_performance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL, -- 'internal_comparison', 'repository_comparison', 'add_to_repository'
  file_count integer,
  repository_size integer,
  execution_time_ms integer,
  match_count integer,
  grade_level text,
  performed_by uuid REFERENCES auth.users(id),
  school_id uuid REFERENCES public.schools(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_comparison_performance_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance log
CREATE POLICY "Users can view their school's performance logs"
ON public.pdf_comparison_performance_log
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert performance logs"
ON public.pdf_comparison_performance_log
FOR INSERT
TO authenticated
WITH CHECK (
  performed_by = auth.uid()
);

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.match_similar_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_documents_hybrid TO authenticated;

-- Add index for performance log queries
CREATE INDEX IF NOT EXISTS idx_performance_log_school_created 
ON public.pdf_comparison_performance_log(school_id, created_at DESC);

-- ============================================
-- Update trigger for pdf_comparison_repository updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_pdf_comparison_repository_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pdf_comparison_repository_updated_at_trigger 
ON public.pdf_comparison_repository;

CREATE TRIGGER update_pdf_comparison_repository_updated_at_trigger
BEFORE UPDATE ON public.pdf_comparison_repository
FOR EACH ROW
EXECUTE FUNCTION public.update_pdf_comparison_repository_updated_at();