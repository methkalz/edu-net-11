-- Check and create proper RLS policies for grade12 final project images

-- First, let's check existing policies for grade10-documents bucket
SELECT * FROM storage.objects WHERE bucket_id = 'grade10-documents' LIMIT 1;

-- Create storage policy for grade12 final project images if it doesn't exist
-- Allow authenticated users to upload images to their own grade12 final projects
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Grade12 students can upload final project images'
    ) THEN
        -- Create policy for grade12 final project image uploads
        CREATE POLICY "Grade12 students can upload final project images"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
            bucket_id = 'grade10-documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]  -- Check that user ID matches folder structure
            AND (storage.foldername(name))[1] = 'grade12-final-projects'  -- Ensure it's in grade12 folder
        );
    END IF;

    -- Check if the read policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Grade12 students can view final project images'
    ) THEN
        -- Create policy for grade12 final project image viewing
        CREATE POLICY "Grade12 students can view final project images"
        ON storage.objects
        FOR SELECT
        USING (
            bucket_id = 'grade10-documents' 
            AND (storage.foldername(name))[1] = 'grade12-final-projects'
        );
    END IF;

    -- Check if the update policy already exists  
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Grade12 students can update their final project images'
    ) THEN
        -- Create policy for grade12 final project image updates
        CREATE POLICY "Grade12 students can update their final project images"
        ON storage.objects
        FOR UPDATE
        USING (
            bucket_id = 'grade10-documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND (storage.foldername(name))[1] = 'grade12-final-projects'
        );
    END IF;

    -- Check if the delete policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Grade12 students can delete their final project images'
    ) THEN
        -- Create policy for grade12 final project image deletion
        CREATE POLICY "Grade12 students can delete their final project images"
        ON storage.objects
        FOR DELETE
        USING (
            bucket_id = 'grade10-documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND (storage.foldername(name))[1] = 'grade12-final-projects'
        );
    END IF;
END
$$;