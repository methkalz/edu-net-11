import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type ComparisonResult } from '@/hooks/usePDFComparison';
import ComparisonResultCard from './ComparisonResultCard';
import { toast } from 'sonner';
import { DevErrorDisplay } from '@/components/error/DevErrorDisplay';
import { handleError } from '@/lib/error-handling';

interface ComparisonUploadZoneProps {
  gradeLevel: GradeLevel;
}

interface FileWithResult {
  file: File;
  result?: ComparisonResult | null;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    phase?: 'upload' | 'extraction' | 'comparison';
  };
}

const ComparisonUploadZone = ({ gradeLevel }: ComparisonUploadZoneProps) => {
  const { compareFile, isLoading } = usePDFComparison();
  const [files, setFiles] = useState<FileWithResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [globalError, setGlobalError] = useState<Error | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithResult[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 52428800, // 50MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompareAll = async () => {
    if (files.length === 0) {
      toast.error('الرجاء رفع ملف واحد على الأقل');
      return;
    }

    setIsComparing(true);

    for (let i = 0; i < files.length; i++) {
      const fileWithResult = files[i];
      
      if (fileWithResult.status === 'completed') continue;

      // تحديث الحالة إلى "processing"
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      try {
        const result = await compareFile(
          fileWithResult.file,
          gradeLevel,
          (progress) => {
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress } : f
            ));
          }
        );

        if (result.success) {
          setFiles(prev => prev.map((f, idx) => 
            idx === i 
              ? { ...f, result: result.data, status: 'completed' as const, progress: 100 } 
              : f
          ));
        } else {
          throw new Error(result.error || 'فشلت المقارنة');
        }
      } catch (error) {
        const appError = handleError(error, {
          context: 'ComparisonUploadZone.handleCompareAll',
          fileName: fileWithResult.file.name,
          fileSize: fileWithResult.file.size,
          gradeLevel,
          fileIndex: i
        });

        console.error('❌ [PDF Comparison] Detailed error:', {
          fileName: fileWithResult.file.name,
          fileSize: fileWithResult.file.size,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error' as const,
            error: {
              message: error instanceof Error ? error.message : 'خطأ غير معروف',
              code: appError.code,
              details: appError.details,
              phase: 'comparison'
            }
          } : f
        ));
        
        setGlobalError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    setIsComparing(false);
    toast.success('اكتملت المقارنة لجميع الملفات');
  };

  const handleClear = () => {
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Development Error Display */}
      {import.meta.env.DEV && globalError && (
        <DevErrorDisplay 
          error={globalError}
          context={{
            component: 'ComparisonUploadZone',
            gradeLevel,
            filesCount: files.length,
            isComparing
          }}
        />
      )}
      
      {/* Files List */}
      {files.length > 0 && (
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    الملفات المحددة
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {files.length} {files.length === 1 ? 'ملف' : 'ملفات'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                  disabled={isComparing}
                  className="hover:shadow-sm transition-all duration-200"
                >
                  <X className="h-4 w-4 ml-2" />
                  مسح
                </Button>
                <Button
                  onClick={handleCompareAll}
                  disabled={isComparing || files.every(f => f.status === 'completed')}
                  size="sm"
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جارٍ المقارنة...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 ml-2" />
                      بدء المقارنة
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {files.map((fileWithResult, index) => (
                <Card 
                  key={index} 
                  className="border bg-background/50"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* File Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">
                              {fileWithResult.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fileWithResult.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        {fileWithResult.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isComparing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {fileWithResult.status === 'processing' && (
                        <div className="space-y-2">
                          <Progress value={fileWithResult.progress} className="h-1.5" />
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">
                              جارٍ المعالجة... {fileWithResult.progress}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Result */}
                      {fileWithResult.status === 'completed' && fileWithResult.result && (
                        <div>
                          <ComparisonResultCard result={fileWithResult.result} />
                        </div>
                      )}

                      {fileWithResult.status === 'error' && (
                        <div className="text-xs text-destructive text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="font-medium">⚠️ فشلت المقارنة</p>
                          <p className="text-[10px] mt-1 text-muted-foreground">
                            {fileWithResult.error?.message || 'يرجى المحاولة مرة أخرى'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropzone */}
      <Card className={`
        border-2 border-dashed cursor-pointer transition-all
        ${isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/30 hover:border-primary/60'
        }
        ${isComparing ? 'pointer-events-none opacity-50' : ''}
      `}
      {...getRootProps()}
      >
        <CardContent className="p-12">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          
            {isDragActive ? (
              <div className="text-center space-y-1">
                <p className="font-semibold text-primary">
                  أفلت الملفات هنا
                </p>
                <p className="text-sm text-muted-foreground">جاهز لاستقبال ملفات PDF</p>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <p className="font-semibold">
                    اسحب وأفلت ملفات PDF هنا
                  </p>
                  <p className="text-sm text-muted-foreground">
                    أو انقر لاختيار الملفات
                    <br />
                    <span className="text-xs">(حد أقصى 50MB)</span>
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  اختيار الملفات
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonUploadZone;
