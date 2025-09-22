import React, { useEffect, useImperativeHandle, forwardRef, useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, Printer, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import RealPageContainer from './RealPageContainer';

interface MultiPageA4EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
}

export interface MultiPageA4EditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  save: () => Promise<void>;
}

const MultiPageA4Editor = forwardRef<MultiPageA4EditorRef, MultiPageA4EditorProps>(({
  initialContent = '',
  onContentChange,
  onSave,
  readOnly = false,
  autoSave = true,
  autoSaveInterval = 30000,
  className
}, ref) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const pageContainerRef = useRef<{ getContent: () => string; setContent: (content: string) => void }>(null);

  // Handle content changes from RealPageContainer
  const handleContentChange = useCallback((content: string) => {
    setCurrentContent(content);
    
    // Calculate word count
    const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Trigger external content change
    onContentChange?.(content);
    
    // Auto-save logic
    if (autoSave && onSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(content);
      }, autoSaveInterval);
    }
  }, [onContentChange, autoSave, onSave, autoSaveInterval]);

  const handleAutoSave = async (content: string) => {
    if (!onSave || isSaving) return;
    
    try {
      setIsSaving(true);
      await onSave(content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('فشل في الحفظ التلقائي');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!onSave || isSaving) return;
    
    try {
      setIsSaving(true);
      await onSave(currentContent);
      setLastSaved(new Date());
      toast.success('تم حفظ المستند بنجاح');
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('فشل في حفظ المستند');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'لم يتم الحفظ بعد';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'تم الحفظ للتو';
    if (diffInSeconds < 3600) return `تم الحفظ منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    return `تم الحفظ منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  };

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getContent: () => currentContent,
    setContent: (content: string) => {
      setCurrentContent(content);
      handleContentChange(content);
    },
    focus: () => {
      // Focus the first editable page
      const firstEditablePage = document.querySelector('[contenteditable="true"]') as HTMLElement;
      if (firstEditablePage) {
        firstEditablePage.focus();
      }
    },
    save: handleManualSave
  }));

  // Update content when initialContent changes
  useEffect(() => {
    if (initialContent !== currentContent) {
      setCurrentContent(initialContent);
    }
  }, [initialContent]);

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Calculate page count from content
  useEffect(() => {
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: 642px;
      direction: rtl;
      text-align: right;
      font-family: 'Arial', 'Tahoma', sans-serif;
      font-size: 16px;
      line-height: 24px;
      padding: 0;
      margin: 0;
    `;
    
    tempDiv.innerHTML = currentContent;
    document.body.appendChild(tempDiv);
    
    const height = tempDiv.scrollHeight;
    const calculatedPageCount = Math.max(1, Math.ceil(height / 971)); // CONTENT_HEIGHT = 971px
    
    document.body.removeChild(tempDiv);
    setPageCount(calculatedPageCount);
  }, [currentContent]);

  return (
    <div className={cn('w-full mx-auto', className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {wordCount.toLocaleString('ar')} كلمة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {pageCount.toLocaleString('ar')} صفحة
            </Badge>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatLastSaved(lastSaved)}
              </span>
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span className="text-xs text-muted-foreground">جاري الحفظ...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onSave && !readOnly && (
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              size="sm"
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ
            </Button>
          )}
          <Button
            onClick={handlePrint}
            size="sm"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Real Page Container */}
      <RealPageContainer
        htmlContent={currentContent}
        readOnly={readOnly}
        onContentChange={handleContentChange}
        className="w-full"
      />
    </div>
  );
});

MultiPageA4Editor.displayName = 'MultiPageA4Editor';

export default MultiPageA4Editor;