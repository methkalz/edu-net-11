-- Update publication date for all Grade 10 documents to 50 days ago
UPDATE public.grade10_documents 
SET published_at = now() - interval '50 days', 
    updated_at = now()
WHERE published_at IS NOT NULL;