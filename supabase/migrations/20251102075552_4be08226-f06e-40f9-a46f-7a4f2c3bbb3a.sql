-- ============================================
-- PDF Comparison Plugin - Database Migration (Fixed)
-- ============================================

-- 1. إضافة Plugin إلى جدول plugins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM plugins WHERE name = 'pdf-comparison') THEN
    INSERT INTO plugins (
      name,
      name_ar,
      description,
      description_ar,
      category,
      icon,
      default_status
    ) VALUES (
      'pdf-comparison',
      'مقارنة ملفات PDF',
      'Advanced PDF comparison system to detect plagiarism and similarity in student projects',
      'نظام متقدم لمقارنة ملفات PDF واكتشاف التشابه والنسخ في مشاريع الطلاب',
      'academic-integrity',
      'FileSearch',
      'disabled'
    );
  END IF;
END $$;

-- 2. إنشاء جدول مستودع الملفات المرجعية
CREATE TABLE IF NOT EXISTS public.pdf_comparison_repository (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('10', '12')),
  project_type TEXT NOT NULL CHECK (project_type IN ('mini_project', 'final_project')),
  
  -- النص المستخرج والمعالج
  extracted_text TEXT,
  text_hash TEXT,
  word_count INTEGER,
  
  -- Embeddings/TF-IDF vectors
  text_embeddings JSONB,
  tfidf_vector JSONB,
  
  -- معلومات إضافية
  language_detected TEXT DEFAULT 'ar',
  metadata JSONB,
  
  -- معلومات الرفع
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- الارتباط بالمشروع الأصلي
  source_project_id UUID,
  source_project_type TEXT CHECK (source_project_type IN ('grade10_mini_project', 'grade12_final_project')),
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_file_hash UNIQUE (text_hash)
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_pdf_repo_grade_level ON pdf_comparison_repository(grade_level);
CREATE INDEX IF NOT EXISTS idx_pdf_repo_project_type ON pdf_comparison_repository(project_type);
CREATE INDEX IF NOT EXISTS idx_pdf_repo_school_id ON pdf_comparison_repository(school_id);
CREATE INDEX IF NOT EXISTS idx_pdf_repo_text_hash ON pdf_comparison_repository(text_hash);
CREATE INDEX IF NOT EXISTS idx_pdf_repo_created_at ON pdf_comparison_repository(created_at DESC);

-- Enable RLS
ALTER TABLE public.pdf_comparison_repository ENABLE ROW LEVEL SECURITY;

-- 3. إنشاء جدول نتائج المقارنة
CREATE TABLE IF NOT EXISTS public.pdf_comparison_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الملف المُقارَن
  compared_file_name TEXT NOT NULL,
  compared_file_path TEXT NOT NULL,
  compared_file_hash TEXT,
  compared_extracted_text TEXT,
  
  -- معلومات المقارنة
  grade_level TEXT NOT NULL CHECK (grade_level IN ('10', '12')),
  comparison_type TEXT NOT NULL CHECK (comparison_type IN ('mini_project', 'final_project')),
  
  -- النتائج
  matches JSONB NOT NULL DEFAULT '[]',
  max_similarity_score NUMERIC(5,2),
  avg_similarity_score NUMERIC(5,2),
  total_matches_found INTEGER DEFAULT 0,
  high_risk_matches INTEGER DEFAULT 0,
  
  -- حالة النتيجة
  status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'warning', 'flagged')),
  review_required BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- معلومات الطلب
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- تفاصيل تقنية
  processing_time_ms INTEGER,
  algorithm_used TEXT DEFAULT 'tfidf_cosine',
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comparison_results_grade ON pdf_comparison_results(grade_level);
CREATE INDEX IF NOT EXISTS idx_comparison_results_status ON pdf_comparison_results(status);
CREATE INDEX IF NOT EXISTS idx_comparison_results_school ON pdf_comparison_results(school_id);
CREATE INDEX IF NOT EXISTS idx_comparison_results_requested_by ON pdf_comparison_results(requested_by);
CREATE INDEX IF NOT EXISTS idx_comparison_results_created_at ON pdf_comparison_results(created_at DESC);

-- Enable RLS
ALTER TABLE public.pdf_comparison_results ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء جدول سجل المقارنات
CREATE TABLE IF NOT EXISTS public.pdf_comparison_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_result_id UUID REFERENCES pdf_comparison_results(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('upload', 'compare', 'review', 'delete', 'add_to_repository')),
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_result_id ON pdf_comparison_audit_log(comparison_result_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON pdf_comparison_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON pdf_comparison_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.pdf_comparison_audit_log ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء Storage Buckets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'pdf-comparison-grade12') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('pdf-comparison-grade12', 'pdf-comparison-grade12', false, 52428800, ARRAY['application/pdf']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'pdf-comparison-grade10') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('pdf-comparison-grade10', 'pdf-comparison-grade10', false, 52428800, ARRAY['application/pdf']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'pdf-comparison-temp') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('pdf-comparison-temp', 'pdf-comparison-temp', false, 52428800, ARRAY['application/pdf']);
  END IF;
END $$;

-- 6. RLS Policies for pdf_comparison_repository
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_repository' AND policyname = 'Teachers and admins can view repository in their school') THEN
    CREATE POLICY "Teachers and admins can view repository in their school"
    ON pdf_comparison_repository FOR SELECT
    TO authenticated
    USING (
      school_id = (SELECT school_id FROM profiles WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_repository' AND policyname = 'Teachers and admins can insert to repository') THEN
    CREATE POLICY "Teachers and admins can insert to repository"
    ON pdf_comparison_repository FOR INSERT
    TO authenticated
    WITH CHECK (
      school_id = (SELECT school_id FROM profiles WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_repository' AND policyname = 'Only superadmin can delete from repository') THEN
    CREATE POLICY "Only superadmin can delete from repository"
    ON pdf_comparison_repository FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'superadmin'
      )
    );
  END IF;
END $$;

-- 7. RLS Policies for pdf_comparison_results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_results' AND policyname = 'Teachers can view their own comparison results') THEN
    CREATE POLICY "Teachers can view their own comparison results"
    ON pdf_comparison_results FOR SELECT
    TO authenticated
    USING (
      requested_by = auth.uid()
      OR school_id = (SELECT school_id FROM profiles WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_results' AND policyname = 'Teachers can insert comparison results') THEN
    CREATE POLICY "Teachers can insert comparison results"
    ON pdf_comparison_results FOR INSERT
    TO authenticated
    WITH CHECK (
      requested_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_results' AND policyname = 'Teachers can update their own results') THEN
    CREATE POLICY "Teachers can update their own results"
    ON pdf_comparison_results FOR UPDATE
    TO authenticated
    USING (
      requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('school_admin', 'superadmin')
      )
    );
  END IF;
END $$;

-- 8. RLS Policies for audit_log
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_audit_log' AND policyname = 'Users can view their own audit logs') THEN
    CREATE POLICY "Users can view their own audit logs"
    ON pdf_comparison_audit_log FOR SELECT
    TO authenticated
    USING (
      performed_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role IN ('school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_comparison_audit_log' AND policyname = 'Authenticated users can insert audit logs') THEN
    CREATE POLICY "Authenticated users can insert audit logs"
    ON pdf_comparison_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (performed_by = auth.uid());
  END IF;
END $$;

-- 9. Storage Policies
DO $$
BEGIN
  -- Grade 12 Repository Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers and admins can upload to grade12 repo') THEN
    CREATE POLICY "Teachers and admins can upload to grade12 repo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'pdf-comparison-grade12'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can read from grade12 repo') THEN
    CREATE POLICY "Teachers can read from grade12 repo"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'pdf-comparison-grade12'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Only superadmin can delete from grade12 repo') THEN
    CREATE POLICY "Only superadmin can delete from grade12 repo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'pdf-comparison-grade12'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    );
  END IF;

  -- Grade 10 Repository Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers and admins can upload to grade10 repo') THEN
    CREATE POLICY "Teachers and admins can upload to grade10 repo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'pdf-comparison-grade10'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can read from grade10 repo') THEN
    CREATE POLICY "Teachers can read from grade10 repo"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'pdf-comparison-grade10'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Only superadmin can delete from grade10 repo') THEN
    CREATE POLICY "Only superadmin can delete from grade10 repo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'pdf-comparison-grade10'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    );
  END IF;

  -- Temp bucket Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can upload to temp bucket') THEN
    CREATE POLICY "Teachers can upload to temp bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'pdf-comparison-temp'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('teacher', 'school_admin', 'superadmin')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can read from temp bucket') THEN
    CREATE POLICY "Teachers can read from temp bucket"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'pdf-comparison-temp'
      AND auth.uid() IS NOT NULL
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can delete from temp bucket') THEN
    CREATE POLICY "Teachers can delete from temp bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'pdf-comparison-temp'
      AND auth.uid() IS NOT NULL
    );
  END IF;
END $$;

-- 10. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_pdf_comparison_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pdf_repo_updated_at ON pdf_comparison_repository;
CREATE TRIGGER update_pdf_repo_updated_at
BEFORE UPDATE ON pdf_comparison_repository
FOR EACH ROW
EXECUTE FUNCTION update_pdf_comparison_updated_at();

DROP TRIGGER IF EXISTS update_pdf_results_updated_at ON pdf_comparison_results;
CREATE TRIGGER update_pdf_results_updated_at
BEFORE UPDATE ON pdf_comparison_results
FOR EACH ROW
EXECUTE FUNCTION update_pdf_comparison_updated_at();