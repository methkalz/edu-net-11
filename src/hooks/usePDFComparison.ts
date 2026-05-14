import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { handleError } from '@/lib/error-handling';
import { createSafeStoragePath } from '@/utils/fileNameSanitizer';

export type GradeLevel = '10' | '12';
export type ProjectType = 'mini_project' | 'final_project';

export interface MatchedSegment {
  source_text: string;
  matched_text: string;
  similarity: number;
  source_page: number;
  matched_page: number;
  source_position: number;
  matched_position: number;
  matched_file_name?: string;
  source_type?: string;
}

export interface ComparisonMatch {
  matched_file_id: string;
  matched_file_name: string;
  similarity_score: number;
  similarity_method: string;
  cosine_score?: number;
  jaccard_score?: number;
  flagged: boolean;
  matched_segments?: MatchedSegment[];
  affected_pages?: {
    source_pages: number[];
    matched_pages: number[];
  };
  metadata?: {
    cosine: number;
    jaccard: number;
    length_similarity: number;
    word_count_ratio: number;
    page_count_source?: number;
    page_count_matched?: number;
  };
}

export interface ComparisonResult {
  id: string;
  compared_file_name: string;
  compared_file_path: string;
  grade_level: GradeLevel;
  comparison_type: ProjectType;
  comparison_source?: 'internal' | 'repository' | 'both';
  batch_id?: string;
  
  // المقارنة الداخلية
  internal_matches?: ComparisonMatch[];
  internal_max_similarity?: number;
  internal_high_risk_count?: number;
  
  // المقارنة مع المستودع
  repository_matches?: ComparisonMatch[];
  repository_max_similarity?: number;
  repository_high_risk_count?: number;
  
  // الحقول الأصلية
  matches: ComparisonMatch[];
  max_similarity_score: number;
  avg_similarity_score: number;
  total_matches_found: number;
  total_files_compared?: number;
  high_risk_matches: number;
  status: 'safe' | 'warning' | 'flagged';
  review_required: boolean;
  processing_time_ms: number;
  created_at: string;
  requested_by?: string;
  teacher_name?: string;
  teacher_role?: string;
  added_to_repository?: boolean;
  repository_file_id?: string;
  
  // Hybrid approach للـ segments
  top_matched_segments?: MatchedSegment[];
  segments_file_path?: string;
  segments_count?: number;
  segments_processing_status?: string;
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

export type BatchFileStatus = 'pending' | 'internal_done' | 'repository_done' | 'completed';

export interface ActiveBatchFile {
  id: string;
  name: string;
  batchStatus: BatchFileStatus;
}

export interface ActiveBatch {
  batchId: string;
  gradeLevel: GradeLevel;
  createdAt: string;
  files: ActiveBatchFile[];
}

export const usePDFComparison = () => {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * مقارنة ملفات متعددة (batch comparison)
   * - إضافة جميع الملفات للمستودع
   * - مقارنة داخلية بين الملفات المرفوعة
   * - مقارنة مع المستودع
   */
  const compareBatchFiles = async (
    files: File[],
    gradeLevel: GradeLevel,
    onProgress?: (fileIndex: number, progress: number, phase: string) => void
  ): Promise<{
    success: boolean;
    results?: ComparisonResult[];
    batchId?: string;
    error?: string;
  }> => {
    try {
      console.log(`🚀 Starting batch comparison for ${files.length} files`);

      // الخطوة 1: رفع واستخراج النص بالتوازي (دفعات من 5)
      const CONCURRENCY = 5;
      const filesData: any[] = [];

      for (let batch = 0; batch < files.length; batch += CONCURRENCY) {
        const chunk = files.slice(batch, batch + CONCURRENCY);
        const chunkResults = await Promise.all(
          chunk.map(async (file, chunkIdx) => {
            const idx = batch + chunkIdx;
            onProgress?.(idx, 10, 'upload');

            const filePath = await uploadFile(file, gradeLevel);
            if (!filePath) throw new Error(`فشل رفع الملف: ${file.name}`);

            onProgress?.(idx, 40, 'extraction');

            const { data: extractResult, error: extractError } = await supabase.functions.invoke(
              'pdf-extract-text',
              { body: { filePath, bucket: 'pdf-comparison-temp' } }
            );

            if (extractError || !extractResult?.success || !extractResult?.text) {
              throw new Error(`فشل استخراج النص من: ${file.name}`);
            }

            onProgress?.(idx, 60, 'extraction_complete');
            return {
              fileName: file.name, filePath,
              fileText: extractResult.text,
              fileHash: extractResult.hash,
              filePages: extractResult.pageCount,
              fileSize: file.size,
            };
          })
        );
        filesData.push(...chunkResults);
      }

      // الخطوة 2: تسجيل المهمة في الطابور (سريع — ثوانٍ فقط)
      onProgress?.(0, 70, 'enqueuing');

      const { data: enqueueResult, error: enqueueError } = await supabase.functions.invoke(
        'pdf-enqueue-batch',
        {
          body: {
            files: filesData,
            gradeLevel,
            comparisonType: gradeLevel === '10' ? 'mini_project' : 'final_project',
            userId: userProfile?.user_id,
            schoolId: userProfile?.school_id,
          },
        }
      );

      if (enqueueError || !enqueueResult?.success) {
        throw new Error(enqueueResult?.error || 'فشل تسجيل المهمة');
      }

      onProgress?.(files.length - 1, 100, 'enqueued');

      return {
        success: true,
        batchId: enqueueResult.batchId,
        results: [],
      };
    } catch (error) {
      console.error('❌ Batch comparison error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      };
    }
  };

  // رفع ملف PDF
  const uploadFile = async (file: File, gradeLevel: GradeLevel): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      console.log('📤 [PDF Upload] Starting upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        gradeLevel
      });
      
      const safeFileName = createSafeStoragePath(file.name);
      
      const { data, error } = await supabase.storage
        .from('pdf-comparison-temp')
        .upload(safeFileName, file, {
          contentType: 'application/pdf',
        });

      if (error) {
        console.error('❌ [PDF Upload] Storage error:', error);
        handleError(error, {
          fileName: file.name,
          fileSize: file.size,
          bucket: 'pdf-comparison-temp'
        });
        throw error;
      }

      console.log('✅ [PDF Upload] Upload successful:', data.path);
      setUploadProgress(100);
      return data.path;
      
    } catch (error: any) {
      console.error('❌ [PDF Upload] Fatal error:', {
        fileName: file.name,
        error: error.message,
        stack: error.stack
      });
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
  ): Promise<{ success: boolean; data?: ComparisonResult; error?: string; phase?: string }> => {
    let currentPhase = 'initialization';
    
    try {
      setIsLoading(true);
      onProgress?.(10);

      console.log('🔵 [PDF Comparison] Starting comparison:', {
        fileName: file.name,
        fileSize: file.size,
        gradeLevel,
        timestamp: new Date().toISOString()
      });

      // 1. رفع الملف
      currentPhase = 'upload';
      console.log('📤 [PDF Comparison] Phase: Upload');
      
      const filePath = await uploadFile(file, gradeLevel);
      if (!filePath) {
        throw new Error('Failed to upload file - no file path returned');
      }
      
      console.log('✅ [PDF Comparison] Upload successful:', filePath);
      onProgress?.(30);

      // 2. استخراج النص
      currentPhase = 'extraction';
      console.log('📄 [PDF Comparison] Phase: Text extraction');
      
      const { data: extractData, error: extractError } = await supabase.functions.invoke(
        'pdf-extract-text',
        {
          body: {
            filePath,
            bucket: 'pdf-comparison-temp',
          },
        }
      );

      if (extractError) {
        console.error('❌ [PDF Comparison] Extraction error:', extractError);
        handleError(extractError, {
          phase: 'extraction',
          fileName: file.name,
          filePath
        });
        throw extractError;
      }
      
      if (!extractData?.success) {
        const errorMsg = extractData?.error || 'Extraction failed';
        console.error('❌ [PDF Comparison] Extraction failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ [PDF Comparison] Extraction successful:', {
        textLength: extractData.text?.length,
        totalPages: extractData.pages?.length,
        hash: extractData.hash
      });
      onProgress?.(60);

      // 3. المقارنة
      currentPhase = 'comparison';
      console.log('🔍 [PDF Comparison] Phase: Comparison');
      
      const projectType: ProjectType = gradeLevel === '12' ? 'final_project' : 'mini_project';
      
      const { data: compareData, error: compareError } = await supabase.functions.invoke(
        'pdf-compare',
        {
          body: {
            fileText: extractData.text,
            filePages: extractData.pages,
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

      if (compareError) {
        console.error('❌ [PDF Comparison] Comparison error:', compareError);
        handleError(compareError, {
          phase: 'comparison',
          fileName: file.name,
          filePath,
          gradeLevel,
          projectType
        });
        throw compareError;
      }
      
      if (!compareData?.success) {
        const errorMsg = compareData?.error || 'Comparison failed';
        console.error('❌ [PDF Comparison] Comparison failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ [PDF Comparison] Comparison successful:', {
        status: compareData.result?.status,
        matchesFound: compareData.result?.total_matches_found
      });
      onProgress?.(100);

      toast.success('تمت المقارنة بنجاح');
      return { success: true, data: compareData.result };
      
    } catch (error: any) {
      console.error('❌ [PDF Comparison] Fatal error:', {
        phase: currentPhase,
        fileName: file.name,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      const appError = handleError(error, {
        phase: currentPhase,
        fileName: file.name,
        fileSize: file.size,
        gradeLevel
      });
      
      toast.error('فشلت المقارنة: ' + error.message);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ غير معروف',
        phase: currentPhase
      };
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
        .eq('requested_by', userProfile?.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // جلب بيانات المعلمين
      const userIds = [...new Set((data || []).map((item: any) => item.requested_by).filter(Boolean))];
      
      let teacherNames: Record<string, { full_name: string; role: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, role')
          .in('user_id', userIds);
        
        if (profiles) {
          profiles.forEach((profile: any) => {
            teacherNames[profile.user_id] = {
              full_name: profile.full_name,
              role: profile.role
            };
          });
        }
      }
      
      // تحويل البيانات لإضافة اسم المعلم
      const results = (data || []).map((item: any) => ({
        ...item,
        teacher_name: teacherNames[item.requested_by]?.full_name || 'غير معروف',
        teacher_role: teacherNames[item.requested_by]?.role || 'unknown'
      }));
      
      return results as unknown as ComparisonResult[];
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

  // حذف عدة ملفات من المستودع (bulk delete - للسوبر آدمن فقط)
  const deleteMultipleFromRepository = async (fileIds: string[]): Promise<boolean> => {
    try {
      if (fileIds.length === 0) {
        toast.warning('لم يتم تحديد أي ملفات');
        return false;
      }

      const { error } = await supabase
        .from('pdf_comparison_repository')
        .delete()
        .in('id', fileIds);

      if (error) throw error;

      toast.success(`تم حذف ${fileIds.length} ملف من المستودع بنجاح`);
      return true;
    } catch (error: any) {
      console.error('Bulk delete error:', error);
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

  const watchBatchResults = (batchId: string, onUpdate: (result: any) => void) => {
    return supabase
      .channel(`batch-${batchId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pdf_comparison_results',
          filter: `batch_id=eq.${batchId}`,
        },
        (payload: any) => onUpdate(payload.new)
      )
      .subscribe();
  };

  // جلب الدفعات قيد المعالجة (غير المكتملة) للمعلم الحالي — مجمّعة حسب batch_id
  const getActiveBatches = async (gradeLevel?: GradeLevel): Promise<ActiveBatch[]> => {
    try {
      if (!userProfile?.user_id) return [];

      let query = supabase
        .from('pdf_comparison_results')
        .select('id, batch_id, batch_status, compared_file_name, created_at, grade_level')
        .eq('requested_by', userProfile.user_id)
        .neq('batch_status', 'completed')
        .order('created_at', { ascending: false });

      if (gradeLevel) {
        query = query.eq('grade_level', gradeLevel);
      }

      const { data, error } = await query;
      if (error) throw error;

      // تجميع حسب batch_id
      const batchMap = new Map<string, ActiveBatch>();
      (data || []).forEach((row: any) => {
        if (!row.batch_id) return;
        if (!batchMap.has(row.batch_id)) {
          batchMap.set(row.batch_id, {
            batchId: row.batch_id,
            gradeLevel: row.grade_level,
            createdAt: row.created_at,
            files: [],
          });
        }
        batchMap.get(row.batch_id)!.files.push({
          id: row.id,
          name: row.compared_file_name,
          batchStatus: row.batch_status || 'pending',
        });
      });

      return Array.from(batchMap.values());
    } catch (error: any) {
      console.error('Active batches fetch error:', error);
      return [];
    }
  };

  return {
    isLoading,
    uploadProgress,
    uploadFile,
    compareFile,
    compareBatchFiles,
    watchBatchResults,
    getActiveBatches,
    getComparisonHistory,
    getRepositoryFiles,
    addToRepository,
    deleteFromRepository,
    deleteMultipleFromRepository,
    getRepositoryStats,
  };
};
