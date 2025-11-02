import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { usePDFComparison, type GradeLevel, type ComparisonResult } from '@/hooks/usePDFComparison';
import ComparisonResultCard from './ComparisonResultCard';
import { toast } from 'sonner';

interface ComparisonUploadZoneProps {
  gradeLevel: GradeLevel;
}

interface FileWithResult {
  file: File;
  result?: ComparisonResult | null;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const ComparisonUploadZone = ({ gradeLevel }: ComparisonUploadZoneProps) => {
  const { compareFile, isLoading } = usePDFComparison();
  const [files, setFiles] = useState<FileWithResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);

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

        setFiles(prev => prev.map((f, idx) => 
          idx === i 
            ? { ...f, result, status: 'completed' as const, progress: 100 } 
            : f
        ));
      } catch (error) {
        console.error('Comparison error:', error);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const } : f
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
        relative overflow-hidden border-2 border-dashed rounded-xl cursor-pointer
        transition-all duration-300
        ${isDragActive 
          ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg scale-[1.02]' 
          : 'border-muted-foreground/25 hover:border-primary/50 bg-gradient-to-br from-muted/30 to-background hover:shadow-xl'
        }
        ${isComparing ? 'pointer-events-none opacity-50' : ''}
      `}
      {...getRootProps()}
      >
        <CardContent className="p-12">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full backdrop-blur-sm shadow-lg">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          
          {isDragActive ? (
            <p className="text-lg font-medium">أفلت الملفات هنا...</p>
          ) : (
            <>
              <div>
                <p className="text-lg font-medium mb-1">
                  اسحب وأفلت ملفات PDF هنا
                </p>
                <p className="text-sm text-muted-foreground">
                  أو انقر للاختيار من جهازك (حد أقصى 50MB لكل ملف)
                </p>
              </div>
              <Button type="button" variant="outline">
                اختيار الملفات
              </Button>
            </>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">
                  الملفات المحددة ({files.length})
                </h3>
              </div>
            <div className="flex gap-2">
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isComparing}
              >
                مسح الكل
              </Button>
              <Button
                onClick={handleCompareAll}
                disabled={isComparing || files.every(f => f.status === 'completed')}
                size="sm"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارٍ المقارنة...
                  </>
                ) : (
                  'بدء المقارنة'
                )}
              </Button>
            </div>
          </div>

            <div className="space-y-3">
              {files.map((fileWithResult, index) => (
                <Card key={index} className="p-4 border bg-background/50 hover:shadow-md transition-all duration-300">
                <div className="space-y-3">
                  {/* File Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {fileWithResult.file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
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
                      <Progress value={fileWithResult.progress} />
                      <p className="text-xs text-muted-foreground text-center">
                        جارٍ المعالجة... {fileWithResult.progress}%
                      </p>
                    </div>
                  )}

                  {/* Result */}
                  {fileWithResult.status === 'completed' && fileWithResult.result && (
                    <ComparisonResultCard result={fileWithResult.result} />
                  )}

                  {fileWithResult.status === 'error' && (
                    <div className="text-sm text-red-600 text-center p-2 bg-red-50 rounded">
                      فشلت المقارنة لهذا الملف
                    </div>
                  )}
                </div>
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
