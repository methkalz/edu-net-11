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
    try {
      setIsLoading(true);

      // رفع الملف أولاً
      const filePath = await uploadFile(file, gradeLevel);
      if (!filePath) throw new Error('Failed to upload file');

      const projectType: ProjectType = gradeLevel === '12' ? 'final_project' : 'mini_project';
      const sourceProjectType = gradeLevel === '12' 
        ? 'grade12_final_project' 
        : 'grade10_mini_project';

      const { data, error } = await supabase.functions.invoke('pdf-add-to-repository', {
        body: {
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
        },
      });

      // التعامل مع خطأ 409 (الملف موجود بالفعل)
      if (error) {
        // التحقق من response body للحصول على التفاصيل
        const responseText = await error.context?.body?.text();
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : null;
        } catch {}
        
        // إذا كان الخطأ بسبب ملف مكرر
        if (errorData?.error?.includes('already exists') || 
            errorData?.error?.includes('identical content')) {
          toast.warning('هذا الملف موجود بالفعل في المستودع', {
            description: 'تم العثور على نفس المحتوى في المستودع'
          });
          return false;
        }
        
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to add to repository');
      }

      toast.success('تمت إضافة الملف للمستودع بنجاح');
      return true;
    } catch (error: any) {
      console.error('Add to repository error:', error);
      
      // التحقق من رسالة الخطأ لتحديد إذا كان ملف مكرر
      const errorMessage = error.message || '';
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('identical content') ||
          errorMessage.includes('409')) {
        // تم معالجته أعلاه، لا داعي لعرض رسالة خطأ
        return false;
      }
      
      toast.error('فشلت الإضافة للمستودع');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // حذف ملف من المستودع (للسوبر آدمن فقط)
  const deleteFromRepository = async (fileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pdf_comparison_repository')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast.success('تم حذف الملف من المستودع');
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
