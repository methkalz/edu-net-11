import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type GradeLevel = '10' | '12';
export type ProjectType = 'mini_project' | 'final_project';

export interface ComparisonMatch {
  matched_file_id: string;
  matched_file_name: string;
  similarity_score: number;
  similarity_method: string;
  cosine_score?: number;
  jaccard_score?: number;
  flagged: boolean;
}

export interface ComparisonResult {
  id: string;
  compared_file_name: string;
  compared_file_path: string;
  grade_level: GradeLevel;
  comparison_type: ProjectType;
  matches: ComparisonMatch[];
  max_similarity_score: number;
  avg_similarity_score: number;
  total_matches_found: number;
  high_risk_matches: number;
  status: 'safe' | 'warning' | 'flagged';
  review_required: boolean;
  processing_time_ms: number;
  created_at: string;
}

export interface RepositoryFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  grade_level: GradeLevel;
  project_type: ProjectType;
  word_count: number;
  created_at: string;
}

export const usePDFComparison = () => {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // رفع ملف PDF
  const uploadFile = async (file: File, gradeLevel: GradeLevel): Promise<string | null> => {
    try {
      setIsLoading(true);
      const fileName = `${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('pdf-comparison-temp')
        .upload(fileName, file, {
          contentType: 'application/pdf',
        });

      if (error) throw error;

      setUploadProgress(100);
      return data.path;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الملف: ' + error.message);
      return null;
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // مقارنة ملف مع المستودع
  const compareFile = async (
    file: File,
    gradeLevel: GradeLevel,
    onProgress?: (progress: number) => void
  ): Promise<ComparisonResult | null> => {
    try {
      setIsLoading(true);
      onProgress?.(10);

      // 1. رفع الملف
      const filePath = await uploadFile(file, gradeLevel);
      if (!filePath) throw new Error('Failed to upload file');
      
      onProgress?.(30);

      // 2. استخراج النص
      const { data: extractData, error: extractError } = await supabase.functions.invoke(
        'pdf-extract-text',
        {
          body: {
            filePath,
            bucket: 'pdf-comparison-temp',
          },
        }
      );

      if (extractError) throw extractError;
      if (!extractData?.success) throw new Error(extractData?.error || 'Extraction failed');

      onProgress?.(60);

      // 3. المقارنة
      const projectType: ProjectType = gradeLevel === '12' ? 'final_project' : 'mini_project';
      
      const { data: compareData, error: compareError } = await supabase.functions.invoke(
        'pdf-compare',
        {
          body: {
            fileText: extractData.text,
            fileHash: extractData.hash,
            fileName: file.name,
            filePath,
            gradeLevel,
            comparisonType: projectType,
            userId: userProfile?.user_id,
            schoolId: userProfile?.school_id,
          },
        }
      );

      if (compareError) throw compareError;
      if (!compareData?.success) throw new Error(compareData?.error || 'Comparison failed');

      onProgress?.(100);

      toast.success('تمت المقارنة بنجاح');
      return compareData.result;
    } catch (error: any) {
      console.error('Comparison error:', error);
      toast.error('فشلت المقارنة: ' + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // جلب سجل المقارنات
  const getComparisonHistory = async (gradeLevel?: GradeLevel): Promise<ComparisonResult[]> => {
    try {
      let query = supabase
        .from('pdf_comparison_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as ComparisonResult[];
    } catch (error: any) {
      console.error('History fetch error:', error);
      toast.error('فشل جلب السجل');
      return [];
    }
  };

  // جلب ملفات المستودع
  const getRepositoryFiles = async (gradeLevel?: GradeLevel): Promise<RepositoryFile[]> => {
    try {
      let query = supabase
        .from('pdf_comparison_repository')
        .select('*')
        .order('created_at', { ascending: false });

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as RepositoryFile[];
    } catch (error: any) {
      console.error('Repository fetch error:', error);
      toast.error('فشل جلب المستودع');
      return [];
    }
  };

  // إضافة ملف للمستودع
  const addToRepository = async (
    file: File,
    gradeLevel: GradeLevel,
    sourceProjectId?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // رفع الملف أولاً
      const filePath = await uploadFile(file, gradeLevel);
      if (!filePath) {
        toast.error('فشل رفع الملف');
        return false;
      }

      const projectType: ProjectType = gradeLevel === '12' ? 'final_project' : 'mini_project';
      const sourceProjectType = gradeLevel === '12' 
        ? 'grade12_final_project' 
        : 'grade10_mini_project';

      // استخدام fetch مباشرة للتعامل مع status codes بشكل أفضل
      const session = await supabase.auth.getSession();
      
      let response;
      try {
        response = await fetch(
          `https://swlwhjnwycvjdhgclwlx.supabase.co/functions/v1/pdf-add-to-repository`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bHdoam53eWN2amRoZ2Nsd2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDU4MzgsImV4cCI6MjA3MDg4MTgzOH0.whMWEn_UIrxBa2QbK1leY9QTr1jeTnkUUn3g50fAKus',
            },
            body: JSON.stringify({
              fileName: file.name,
              filePath,
              fileSize: file.size,
              gradeLevel,
              projectType,
              sourceProjectId,
              sourceProjectType,
              userId: userProfile?.user_id,
              schoolId: userProfile?.school_id,
              bucket: 'pdf-comparison-temp',
            }),
          }
        );
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        toast.error('فشل الاتصال بالخادم');
        return false;
      }

      // قراءة الاستجابة
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        toast.error('خطأ في معالجة الاستجابة');
        return false;
      }

      // التعامل مع حالة الملف المكرر (409) - أولاً قبل أي شيء
      if (response.status === 409) {
        console.log('File already exists in repository (409)');
        toast('هذا الملف موجود بالفعل في المستودع', {
          description: 'تم العثور على نفس المحتوى مسبقاً'
        });
        return false;
      }

      // التحقق من الأخطاء الأخرى
      if (!response.ok) {
        console.error('Response not ok:', response.status, data);
        toast.error(data?.error || 'فشلت الإضافة للمستودع');
        return false;
      }

      if (!data?.success) {
        console.error('Operation failed:', data);
        toast.error(data?.error || 'فشلت الإضافة للمستودع');
        return false;
      }

      toast.success('تمت إضافة الملف للمستودع بنجاح');
      return true;
      
    } catch (error: any) {
      console.error('Add to repository error:', error);
      toast.error('حدث خطأ غير متوقع');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // حذف ملف من المستودع (للسوبر آدمن فقط)
  const deleteFromRepository = async (fileId: string): Promise<boolean> => {
    try {
      // 1. جلب معلومات الملف قبل حذفه للتسجيل
      const { data: fileData, error: fetchError } = await supabase
        .from('pdf_comparison_repository')
        .select('file_name, grade_level, project_type, word_count, file_size, uploaded_by')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        console.error('Fetch file error:', fetchError);
        throw new Error('فشل جلب معلومات الملف');
      }

      // 2. حذف الملف
      const { error: deleteError } = await supabase
        .from('pdf_comparison_repository')
        .delete()
        .eq('id', fileId);

      if (deleteError) throw deleteError;

      // 3. تسجيل الحدث في سجل الأحداث
      try {
        await supabase
          .from('pdf_comparison_audit_log')
          .insert({
            action_type: 'repository_file_deleted',
            performed_by: userProfile?.user_id || 'unknown',
            details: {
              file_id: fileId,
              file_name: fileData.file_name,
              grade_level: fileData.grade_level,
              project_type: fileData.project_type,
              word_count: fileData.word_count,
              file_size: fileData.file_size,
              original_uploader: fileData.uploaded_by,
              deleted_at: new Date().toISOString(),
            },
          });
      } catch (auditError) {
        // لا نفشل العملية إذا فشل التسجيل
        console.error('Audit log error:', auditError);
      }

      toast.success('تم حذف الملف من المستودع', {
        description: `الملف: ${fileData.file_name}`,
      });
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
  };

  // إحصائيات المستودع
  const getRepositoryStats = async (gradeLevel?: GradeLevel) => {
    try {
      let query = supabase
        .from('pdf_comparison_repository')
        .select('word_count, file_size, created_at');

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        totalFiles: data?.length || 0,
        totalWords: data?.reduce((sum, f) => sum + (f.word_count || 0), 0) || 0,
        totalSize: data?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0,
        lastUpdate: data?.[0]?.created_at || null,
      };
    } catch (error: any) {
      console.error('Stats error:', error);
      return null;
    }
  };

  return {
    isLoading,
    uploadProgress,
    uploadFile,
    compareFile,
    getComparisonHistory,
    getRepositoryFiles,
    addToRepository,
    deleteFromRepository,
    getRepositoryStats,
  };
};
