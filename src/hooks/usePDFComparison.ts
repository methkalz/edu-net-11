import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { 
  PDFComparisonError, 
  PDFErrorCode, 
  checkFileSize,
  FILE_SIZE_LIMITS 
} from '@/types/pdf-comparison-errors';

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

  // رفع ملف PDF مع فحص الحجم
  const uploadFile = async (file: File, gradeLevel: GradeLevel): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      // فحص حجم الملف قبل الرفع
      const sizeCheck = checkFileSize(file);
      if (!sizeCheck.valid) {
        const error = new PDFComparisonError(
          PDFErrorCode.FILE_TOO_LARGE,
          sizeCheck.error || 'الملف كبير جداً',
          {
            fileName: file.name,
            fileSize: file.size,
            maxAllowed: FILE_SIZE_LIMITS.MAX_FILE_SIZE_BYTES,
          },
          [
            `قلل حجم الملف إلى أقل من ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB`,
            'حاول ضغط الملف أو إزالة الصور غير الضرورية',
            'قسّم المشروع إلى ملفات أصغر',
          ]
        );
        throw error;
      }
      
      if (sizeCheck.warning) {
        toast.warning(sizeCheck.warning, {
          description: 'قد تستغرق المعالجة وقتاً أطول'
        });
      }
      
      logger.info('Uploading PDF file', { 
        fileName: file.name, 
        fileSize: file.size,
        gradeLevel 
      });
      
      const fileName = `${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('pdf-comparison-temp')
        .upload(fileName, file, {
          contentType: 'application/pdf',
        });

      if (error) {
        logger.error('Upload failed', new Error(error.message), { fileName: file.name });
        throw new PDFComparisonError(
          PDFErrorCode.UPLOAD_FAILED,
          'فشل رفع الملف',
          { fileName: file.name, technicalError: error.message },
          ['تحقق من اتصالك بالإنترنت', 'أعد المحاولة بعد قليل']
        );
      }

      setUploadProgress(100);
      logger.info('Upload successful', { filePath: data.path });
      return data.path;
    } catch (error: any) {
      if (error instanceof PDFComparisonError) {
        logger.error('Upload validation error', new Error(error.message), { 
          code: error.code, 
          details: error.details 
        });
        toast.error(error.message, {
          description: error.suggestions[0]
        });
      } else {
        logger.error('Unexpected upload error', new Error(error?.message || String(error)));
        toast.error('فشل رفع الملف: ' + error.message);
      }
      return null;
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // مقارنة ملف مع المستودع مع معالجة أخطاء متقدمة
  const compareFile = async (
    file: File,
    gradeLevel: GradeLevel,
    onProgress?: (progress: number) => void
  ): Promise<ComparisonResult | null> => {
    const startTime = Date.now();
    
    try {
      setIsLoading(true);
      onProgress?.(10);
      
      logger.info('Starting PDF comparison', {
        fileName: file.name,
        fileSize: file.size,
        gradeLevel
      });

      // 1. رفع الملف
      onProgress?.(15);
      const filePath = await uploadFile(file, gradeLevel);
      if (!filePath) {
        throw new PDFComparisonError(
          PDFErrorCode.UPLOAD_FAILED,
          'فشل رفع الملف',
          { fileName: file.name }
        );
      }
      
      onProgress?.(30);
      logger.info('File uploaded successfully', { filePath });

      // 2. استخراج النص
      onProgress?.(35);
      logger.info('Extracting text from PDF...');
      
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
        logger.error('Text extraction failed', new Error(extractError?.message || String(extractError)));
        throw PDFComparisonError.fromResponse(extractError);
      }
      
      if (!extractData?.success) {
        const errorMsg = extractData?.error || 'Extraction failed';
        logger.error('Extraction returned error', new Error(String(errorMsg)));
        
        if (extractData?.error) {
          throw PDFComparisonError.fromResponse(extractData.error);
        }
        
        throw new PDFComparisonError(
          PDFErrorCode.EXTRACTION_FAILED,
          'فشل استخراج النص من الملف',
          { fileName: file.name },
          [
            'تأكد من أن الملف يحتوي على نص قابل للقراءة',
            'الملف قد يكون معطوباً أو محمياً بكلمة مرور',
          ]
        );
      }

      const wordCount = extractData.wordCount || 0;
      logger.info('Text extracted successfully', { 
        wordCount,
        hash: extractData.hash?.substring(0, 8)
      });
      
      // فحص عدد الكلمات
      if (wordCount > FILE_SIZE_LIMITS.MAX_WORD_COUNT) {
        throw new PDFComparisonError(
          PDFErrorCode.TEXT_TOO_LONG,
          'الملف يحتوي على نص طويل جداً',
          {
            fileName: file.name,
            wordCount,
            maxAllowed: FILE_SIZE_LIMITS.MAX_WORD_COUNT,
          },
          [
            `قلل عدد الكلمات إلى أقل من ${FILE_SIZE_LIMITS.MAX_WORD_COUNT.toLocaleString('ar-SA')}`,
            'قسّم المشروع إلى أجزاء أصغر',
          ]
        );
      }
      
      if (wordCount > FILE_SIZE_LIMITS.WARN_WORD_COUNT) {
        toast.warning('الملف يحتوي على نص كبير', {
          description: `${wordCount.toLocaleString('ar-SA')} كلمة - قد يستغرق وقتاً أطول`
        });
      }

      onProgress?.(60);

      // 3. المقارنة
      onProgress?.(65);
      logger.info('Starting comparison with repository...');
      
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
            wordCount,
          },
        }
      );

      if (compareError) {
        logger.error('Comparison failed', new Error(compareError?.message || String(compareError)));
        throw PDFComparisonError.fromResponse(compareError);
      }
      
      if (!compareData?.success) {
        const errorMsg = compareData?.error || 'Comparison failed';
        logger.error('Comparison returned error', new Error(String(errorMsg)));
        
        if (compareData?.error) {
          throw PDFComparisonError.fromResponse(compareData.error);
        }
        
        throw new PDFComparisonError(
          PDFErrorCode.UNKNOWN_ERROR,
          'فشلت المقارنة',
          { fileName: file.name }
        );
      }

      onProgress?.(100);
      
      const processingTime = Date.now() - startTime;
      logger.info('Comparison completed successfully', {
        fileName: file.name,
        status: compareData.result?.status,
        matches: compareData.result?.total_matches_found,
        processingTime
      });

      toast.success('تمت المقارنة بنجاح', {
        description: `تم العثور على ${compareData.result?.total_matches_found || 0} تطابق محتمل`
      });
      
      return compareData.result;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof PDFComparisonError) {
        logger.error('PDF Comparison error', new Error(error.message), {
          code: error.code,
          details: error.details,
          processingTime
        });
        
        toast.error(error.message, {
          description: error.suggestions[0] || 'حاول مرة أخرى'
        });
        
        // رمي الخطأ لكي يتمكن المكون من عرضه
        throw error;
      } else {
        const errorMsg = error?.message || String(error);
        logger.error('Unexpected comparison error', new Error(errorMsg), { processingTime });
        
        const pdfError = PDFComparisonError.fromResponse(error);
        toast.error(pdfError.message, {
          description: pdfError.suggestions[0]
        });
        
        throw pdfError;
      }
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
