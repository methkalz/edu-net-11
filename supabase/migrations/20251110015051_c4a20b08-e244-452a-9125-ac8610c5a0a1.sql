-- Update embedding column to support 1024 dimensions instead of 384
-- First, drop the existing index
DROP INDEX IF EXISTS pdf_comparison_repository_embedding_idx;

-- Drop the old column
ALTER TABLE pdf_comparison_repository DROP COLUMN IF EXISTS embedding;

-- Add the new column with 1024 dimensions
ALTER TABLE pdf_comparison_repository ADD COLUMN embedding vector(1024);

-- Recreate the index for efficient similarity search
CREATE INDEX pdf_comparison_repository_embedding_idx 
ON pdf_comparison_repository 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Optional: Clear old data with incompatible embeddings
-- This ensures no old 384-dimension data remains
DELETE FROM pdf_comparison_repository 
WHERE metadata->>'embedding_version' != 'v3_tfidf_ngrams_stopwords_signed_1024';