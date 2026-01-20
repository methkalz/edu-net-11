import React, { useState, useCallback, useEffect } from 'react';
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

interface BagrutExamUploaderProps {
  onExamParsed: (exam: ParsedExam, statistics: Statistics) => void;
  onCancel: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const BagrutExamUploader: React.FC<BagrutExamUploaderProps> = ({ onExamParsed, onCancel }) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');

  // Progress steps for simulated real-time updates
  const progressSteps = [
    { time: 0, message: 'جاري قراءة ملف PDF...' },
    { time: 3000, message: 'جاري التعرف على هيكل الامتحان...' },
    { time: 8000, message: 'تم اكتشاف الأقسام، جاري تحليلها...' },
    { time: 15000, message: 'جاري استخراج الأسئلة...' },
    { time: 25000, message: 'جاري تحليل السؤال 1-5...' },
    { time: 40000, message: 'جاري تحليل السؤال 6-10...' },
    { time: 55000, message: 'جاري التعرف على الجداول والصور...' },
    { time: 70000, message: 'جاري حساب النقاط والتصنيفات...' },
    { time: 90000, message: 'جاري الانتهاء من التحليل...' },
    { time: 120000, message: 'الملف كبير، يرجى الانتظار...' },
    { time: 150000, message: 'لا يزال التحليل جارياً...' },
  ];

  // Effect to run progress step updates
  useEffect(() => {
    if (uploadStatus === 'processing') {
      const timers: NodeJS.Timeout[] = [];
      
      progressSteps.forEach(step => {
        const timer = setTimeout(() => {
          setCurrentStep(step.message);
        }, step.time);
        timers.push(timer);
      });
      
      return () => timers.forEach(t => clearTimeout(t));
    } else {
      setCurrentStep('');
    }
  }, [uploadStatus]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus('idle');
      setErrorMessage('');
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
    setProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      setProgress(20);
      setUploadStatus('processing');

      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fileType', selectedFile.name.endsWith('.pdf') ? 'pdf' : 'docx');

      setProgress(40);

      // Call edge function with extended timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      const response = await fetch(
        `https://swlwhjnwycvjdhgclwlx.supabase.co/functions/v1/parse-bagrut-exam`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Connection': 'keep-alive',
          },
          body: formData,
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحليل الامتحان');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'فشل في تحليل الامتحان');
      }

      setProgress(100);
      setUploadStatus('success');
      
      toast.success('تم تحليل الامتحان بنجاح!');
      
      // Pass parsed data to parent
      onExamParsed(result.parsedExam, result.statistics);

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadStatus('error');
      
      // Handle abort/timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage('انتهت مهلة المعالجة. الملف كبير جداً، يرجى المحاولة بملف أصغر.');
        toast.error('انتهت مهلة المعالجة. الرجاء المحاولة مجدداً.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
        toast.error(error instanceof Error ? error.message : 'حدث خطأ في معالجة الملف');
      }
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setProgress(0);
    setErrorMessage('');
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
        return 'جاري تحليل الامتحان... (قد يستغرق 1-3 دقائق)';
      case 'success':
        return 'تم تحليل الامتحان بنجاح!';
      case 'error':
        return errorMessage;
      default:
        return selectedFile ? selectedFile.name : 'اسحب وأفلت ملف الامتحان هنا';
    }
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
              {progress}% - {uploadStatus === 'uploading' ? 'رفع الملف' : 'تحليل بالذكاء الاصطناعي'}
            </p>
            {uploadStatus === 'processing' && currentStep && (
              <p className="text-sm text-center text-primary font-medium animate-pulse">
                {currentStep}
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
