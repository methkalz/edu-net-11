import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, Loader2, AlertTriangle } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type ComparisonResult } from '@/hooks/usePDFComparison';
import ComparisonResultCard from './ComparisonResultCard';
import ErrorDetailsCard from './ErrorDetailsCard';
import { toast } from 'sonner';
import { PDFComparisonError, checkFileSize, formatFileSize } from '@/types/pdf-comparison-errors';

interface ComparisonUploadZoneProps {
  gradeLevel: GradeLevel;
}

interface FileWithResult {
  file: File;
  result?: ComparisonResult | null;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: PDFComparisonError;
  warning?: string;
}

const ComparisonUploadZone = ({ gradeLevel }: ComparisonUploadZoneProps) => {
  const { compareFile, isLoading } = usePDFComparison();
  const [files, setFiles] = useState<FileWithResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithResult[] = acceptedFiles.map(file => {
      // فحص حجم الملف مباشرة
      const sizeCheck = checkFileSize(file);
      
      if (!sizeCheck.valid) {
        toast.error(sizeCheck.error || 'الملف كبير جداً');
        return null;
      }
      
      return {
        file,
        progress: 0,
        status: 'pending' as const,
        warning: sizeCheck.warning,
      };
    }).filter(Boolean) as FileWithResult[];
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
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

        setFiles(prev => prev.map((f, idx) => 
          idx === i 
            ? { ...f, result, status: 'completed' as const, progress: 100, error: undefined } 
            : f
        ));
      } catch (error) {
        console.error('Comparison error:', error);
        
        const pdfError = error instanceof PDFComparisonError 
          ? error 
          : PDFComparisonError.fromResponse(error);
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i 
            ? { ...f, status: 'error' as const, error: pdfError } 
            : f
        ));
      }
    }

    setIsComparing(false);
    toast.success('اكتملت المقارنة لجميع الملفات');
  };

  const handleClear = () => {
    setFiles([]);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card className={`
        relative overflow-hidden border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-500 group
        ${isDragActive 
          ? 'border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-2xl scale-[1.02]' 
          : 'border-muted-foreground/30 hover:border-primary/60 bg-gradient-to-br from-card via-card/95 to-card/90 hover:shadow-xl'
        }
        ${isComparing ? 'pointer-events-none opacity-50' : ''}
      `}
      {...getRootProps()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500" />
        
        <CardContent className="p-16 relative z-10">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-6">
            <div className="relative group-hover:scale-110 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative p-6 bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 rounded-full backdrop-blur-sm shadow-lg">
                <Upload className={`h-10 w-10 text-primary transition-transform duration-500 ${isDragActive ? 'scale-125' : ''}`} />
              </div>
            </div>
          
          {isDragActive ? (
            <div className="text-center space-y-2 animate-pulse">
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                أفلت الملفات هنا
              </p>
              <p className="text-muted-foreground">جاهز لاستقبال ملفات PDF</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-3">
                <p className="text-xl font-bold text-foreground">
                  اسحب وأفلت ملفات PDF هنا
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  قم برفع ملف واحد أو عدة ملفات للمقارنة مع المستودع
                  <br />
                  <span className="text-xs">(حد أقصى 50MB لكل ملف)</span>
                </p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Upload className="h-4 w-4" />
                اختيار الملفات
              </Button>
            </>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-50" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    الملفات المحددة
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {files.length} {files.length === 1 ? 'ملف' : 'ملفات'} جاهز للمقارنة
                  </p>
                </div>
              </div>
            <div className="flex gap-3">
              <Button
                onClick={handleClear}
                variant="outline"
                size="default"
                disabled={isComparing}
                className="hover:bg-destructive hover:text-destructive-foreground transition-all"
              >
                <X className="h-4 w-4 ml-2" />
                مسح الكل
              </Button>
              <Button
                onClick={handleCompareAll}
                disabled={isComparing || files.every(f => f.status === 'completed')}
                size="default"
                className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
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

            <div className="space-y-4">
              {files.map((fileWithResult, index) => (
                <Card 
                  key={index} 
                  className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background/95 to-background/90 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardContent className="p-5 relative z-10">
                    <div className="space-y-4">
                      {/* File Info */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                           <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-foreground">
                              {fileWithResult.file.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatFileSize(fileWithResult.file.size)}</span>
                              {fileWithResult.warning && (
                                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">ملف كبير</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {fileWithResult.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isComparing}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {fileWithResult.status === 'processing' && (
                        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                          <Progress value={fileWithResult.progress} className="h-2" />
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <p className="text-sm font-medium text-foreground">
                              {fileWithResult.progress < 30 && 'جارٍ رفع الملف...'}
                              {fileWithResult.progress >= 30 && fileWithResult.progress < 60 && 'جارٍ استخراج النص...'}
                              {fileWithResult.progress >= 60 && 'جارٍ المقارنة مع المستودع...'}
                              {' '}
                              {fileWithResult.progress}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Result */}
                      {fileWithResult.status === 'completed' && fileWithResult.result && (
                        <div className="animate-fade-in">
                          <ComparisonResultCard result={fileWithResult.result} />
                        </div>
                      )}

                      {fileWithResult.status === 'error' && fileWithResult.error && (
                        <ErrorDetailsCard 
                          error={fileWithResult.error}
                          onRetry={async () => {
                            // إعادة المحاولة
                            setFiles(prev => prev.map((f, idx) => 
                              idx === index 
                                ? { ...f, status: 'processing' as const, progress: 0, error: undefined } 
                                : f
                            ));
                            
                            try {
                              const result = await compareFile(
                                fileWithResult.file,
                                gradeLevel,
                                (progress) => {
                                  setFiles(prev => prev.map((f, idx) => 
                                    idx === index ? { ...f, progress } : f
                                  ));
                                }
                              );
                              
                              setFiles(prev => prev.map((f, idx) => 
                                idx === index 
                                  ? { ...f, result, status: 'completed' as const, progress: 100 } 
                                  : f
                              ));
                            } catch (error) {
                              const pdfError = error instanceof PDFComparisonError 
                                ? error 
                                : PDFComparisonError.fromResponse(error);
                              
                              setFiles(prev => prev.map((f, idx) => 
                                idx === index 
                                  ? { ...f, status: 'error' as const, error: pdfError } 
                                  : f
                              ));
                            }
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComparisonUploadZone;
