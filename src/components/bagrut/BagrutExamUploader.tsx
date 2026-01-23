import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParsedExam {
  title: string;
  exam_year: number;
  exam_season: string;
  exam_code?: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  instructions?: string;
  sections: any[];
}

interface Statistics {
  totalSections: number;
  totalQuestions: number;
  questionsByType: Record<string, number>;
  totalPoints: number;
}

interface AnswersReport {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  unansweredList: Array<{ question_number: string; question_type: string; reason: string }>;
}

export interface PointsReport {
  declaredTotal: number;
  actualTotal: number;
  difference: number;
  isValid: boolean;
  breakdown?: {
    mandatory: number;
    electiveSections: Array<{ name: string; points: number; specialization?: string; questionCount?: number }>;
    selectedElective: number;
    questionCounts?: {
      mandatory: number;
      elective: Array<{ name: string; count: number }>;
    };
  };
  issues: Array<{
    type: 'missing_points' | 'excess_points' | 'zero_points_question';
    description: string;
    section?: string;
    question?: string;
    suggestedFix?: string;
  }>;
}

interface BagrutExamUploaderProps {
  onExamParsed: (exam: ParsedExam, statistics: Statistics, answersReport?: AnswersReport, pointsReport?: PointsReport) => void;
  onCancel: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const BagrutExamUploader: React.FC<BagrutExamUploaderProps> = ({ onExamParsed, onCancel }) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for job status
  const startPolling = async (newJobId: string) => {
    const poll = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          stopPolling();
          setUploadStatus('error');
          setErrorMessage('انتهت الجلسة. يرجى تسجيل الدخول مجدداً.');
          return;
        }

        const response = await fetch(
          `https://swlwhjnwycvjdhgclwlx.supabase.co/functions/v1/check-bagrut-job`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobId: newJobId }),
          }
        );

        if (!response.ok) {
          console.error('Poll response not ok:', response.status);
          return;
        }

        const data = await response.json();
        
        if (!data.success) {
          console.error('Poll error:', data.error);
          return;
        }

        // Update UI with job status
        setProgress(data.progress || 0);
        setCurrentStep(data.currentStep || '');

        if (data.status === 'completed') {
          stopPolling();
          setUploadStatus('success');
          setProgress(100);
          toast.success('تم تحليل الامتحان بنجاح!');
          
          // Pass parsed data to parent
          if (data.result?.parsedExam && data.result?.statistics) {
            onExamParsed(data.result.parsedExam, data.result.statistics, data.result.answersReport, data.result.pointsReport);
          }
        } else if (data.status === 'failed') {
          stopPolling();
          setUploadStatus('error');
          setErrorMessage(data.error || 'فشل في تحليل الامتحان');
          toast.error(data.error || 'فشل في تحليل الامتحان');
        }
        // If still processing, continue polling

      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on network errors, just retry
      }
    };

    // Start polling every 3 seconds
    pollingIntervalRef.current = setInterval(poll, 3000);
    
    // Also poll immediately
    poll();
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus('idle');
      setErrorMessage('');
      setJobId(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const processFile = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setProgress(5);
    setCurrentStep('جاري رفع الملف...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      setProgress(10);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fileType', selectedFile.name.endsWith('.pdf') ? 'pdf' : 'docx');

      // Call edge function - this will return immediately with a job ID
      const response = await fetch(
        `https://swlwhjnwycvjdhgclwlx.supabase.co/functions/v1/parse-bagrut-exam`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في بدء تحليل الامتحان');
      }

      const result = await response.json();

      if (!result.success || !result.jobId) {
        throw new Error(result.error || 'فشل في إنشاء مهمة التحليل');
      }

      // Got job ID, start polling
      setJobId(result.jobId);
      setUploadStatus('processing');
      setProgress(15);
      setCurrentStep('جاري بدء المعالجة...');
      
      // Start polling for status
      startPolling(result.jobId);

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadStatus('error');
      stopPolling();
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في معالجة الملف');
    }
  };

  const resetUpload = () => {
    stopPolling();
    setSelectedFile(null);
    setUploadStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setJobId(null);
    setCurrentStep('');
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Upload className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'جاري رفع الملف...';
      case 'processing':
        return 'جاري تحليل الامتحان...';
      case 'success':
        return 'تم تحليل الامتحان بنجاح!';
      case 'error':
        return errorMessage;
      default:
        return selectedFile ? selectedFile.name : 'اسحب وأفلت ملف الامتحان هنا';
    }
  };

  const getDisplayStepText = (step: string) => {
    // Normalize backend/model-specific messages into user-friendly branding
    if (step.includes('google/gemini-2.5-pro')) {
      return 'جاري التحليل باستخدام موديل Edunet Ai';
    }
    return step;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">رفع امتحان بجروت جديد</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${uploadStatus !== 'idle' && uploadStatus !== 'error' ? 'pointer-events-none opacity-60' : ''}
            hover:border-primary hover:bg-primary/5
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            {getStatusIcon()}
            <div className="space-y-2">
              <p className="text-lg font-medium">{getStatusText()}</p>
              {uploadStatus === 'idle' && !selectedFile && (
                <p className="text-sm text-muted-foreground">
                  يدعم ملفات PDF فقط
                </p>
              )}
              {selectedFile && uploadStatus === 'idle' && (
                <p className="text-sm text-muted-foreground">
                  الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {uploadStatus === 'uploading'
                ? `جاري رفع الملف — ${progress}%`
                : `نقوم حاليًا بتحليل الإمتحان — ${progress}%`}
            </p>
            {currentStep && (
              <p className="text-sm text-center text-primary font-medium animate-pulse">
                {getDisplayStepText(currentStep)}
              </p>
            )}
            {uploadStatus === 'processing' && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                قد يستغرق التحليل 5-10 دقائق للملفات الكبيرة
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {uploadStatus === 'idle' && selectedFile && (
            <>
              <Button onClick={processFile} className="gap-2">
                <FileText className="h-4 w-4" />
                تحليل الامتحان
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                إلغاء
              </Button>
            </>
          )}
          
          {uploadStatus === 'error' && (
            <Button variant="outline" onClick={resetUpload}>
              المحاولة مرة أخرى
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <h4 className="font-medium mb-2">ملاحظات مهمة:</h4>
          <ul className="list-disc list-inside space-y-1 text-right">
            <li>يُدعم حالياً <strong>ملفات PDF فقط</strong></li>
            <li>تأكد من أن الملف يحتوي على امتحان بجروت كامل</li>
            <li>سيتم استخراج الأسئلة والإجابات والشروحات تلقائياً</li>
            <li>يمكنك مراجعة وتعديل البيانات بعد التحليل</li>
            <li>الصور والجداول ستُستخرج تلقائياً</li>
            <li>
              لتحويل ملف Word إلى PDF مجاناً:{' '}
              <a 
                href="https://www.ilovepdf.com/word_to_pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                iLovePDF
              </a>
              {' | '}
              <a 
                href="https://smallpdf.com/word-to-pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SmallPDF
              </a>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BagrutExamUploader;
