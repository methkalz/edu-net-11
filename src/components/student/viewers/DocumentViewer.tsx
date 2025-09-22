import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, X, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    description?: string;
    file_path: string;
    file_type: string;
  };
  onProgress: (progress: number, readTime: number) => void;
  onComplete: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  isOpen, 
  onClose, 
  document, 
  onProgress,
  onComplete 
}) => {
  const [readTime, setReadTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (isOpen && !hasStarted) {
      setHasStarted(true);
      toast.info('بدأت قراءة المستند', {
        description: 'ستحصل على النقاط عند إكمال القراءة'
      });
    }
  }, [isOpen, hasStarted]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setReadTime(prev => {
        const newTime = prev + 1;
        
        // Calculate progress based on reading time and scroll
        // Assume minimum 30 seconds reading time for completion
        const timeProgress = Math.min((newTime / 30) * 100, 100);
        const combinedProgress = Math.max(timeProgress, scrollProgress);
        
        setProgress(combinedProgress);
        onProgress(combinedProgress, newTime);

        // Mark as complete if read for 30 seconds and scrolled significantly
        if (combinedProgress >= 90 && !isCompleted) {
          setIsCompleted(true);
          onComplete();
          toast.success('تم إكمال قراءة المستند بنجاح!', {
            description: 'تم إضافة النقاط إلى رصيدك'
          });
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, scrollProgress, onProgress, onComplete, isCompleted]);

  const handleScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      const scrollPercent = (scrollTop / maxScroll) * 100;
      setScrollProgress(Math.min(scrollPercent, 100));
    }
  };

  const handleClose = () => {
    // Save final progress before closing
    if (progress > 0) {
      onProgress(progress, readTime);
    }
    onClose();
  };

  const downloadDocument = () => {
    window.open(document.file_path, '_blank');
  };

  const isPDF = document.file_type.toLowerCase().includes('pdf');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document.title}
              </DialogTitle>
              {document.description && (
                <p className="text-sm text-muted-foreground">{document.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  مكتمل
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={downloadDocument}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Document Viewer */}
          <div className="border rounded-lg overflow-hidden bg-muted/20">
            {isPDF ? (
              <iframe
                src={document.file_path}
                className="w-full h-[60vh]"
                title={document.title}
              />
            ) : (
              <ScrollArea 
                className="h-[60vh] p-6"
                onScrollCapture={(e) => {
                  const target = e.target as HTMLElement;
                  handleScroll(target.scrollTop, target.scrollHeight, target.clientHeight);
                }}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="text-center py-12">
                    <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      يرجى تنزيل المستند لعرضه أو فتحه في نافذة جديدة
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={downloadDocument}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      تنزيل المستند
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">تقدم القراءة</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">وقت القراءة</span>
                <span className="font-medium">
                  {Math.floor(readTime / 60)}:{(readTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Progress value={Math.min((readTime / 30) * 100, 100)} className="h-2" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              إغلاق
            </Button>
            {isCompleted && (
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                مكتمل
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};