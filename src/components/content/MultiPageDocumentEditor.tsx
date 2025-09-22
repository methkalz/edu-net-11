import React, { useEffect, useImperativeHandle, forwardRef, useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Printer, FileText, Clock, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

// A4 page dimensions in pixels (96 DPI)
const A4_WIDTH = 794; // 21cm at 96 DPI
const A4_HEIGHT = 1123; // 29.7cm at 96 DPI
const PAGE_MARGIN = 76; // 2cm margins
const CONTENT_WIDTH = A4_WIDTH - (PAGE_MARGIN * 2);
const CONTENT_HEIGHT = A4_HEIGHT - (PAGE_MARGIN * 2); // ~971px usable height

interface PageData {
  id: string;
  content: string;
  wordCount: number;
}

interface MultiPageDocumentEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
}

export interface MultiPageDocumentEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  save: () => Promise<void>;
}

const MultiPageDocumentEditor = forwardRef<MultiPageDocumentEditorRef, MultiPageDocumentEditorProps>(({
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
  const [pages, setPages] = useState<PageData[]>([
    { id: '1', content: initialContent, wordCount: 0 }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Main editor for all content
  const mainEditor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleContentChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
          'prose-headings:text-right prose-p:text-right',
          'prose-ul:text-right prose-ol:text-right',
          'min-h-full w-full p-4',
          '[&_*]:direction-rtl [&_*]:text-right'
        ),
        dir: 'rtl',
        style: `
          direction: rtl; 
          text-align: right; 
          font-family: Arial, Tahoma, sans-serif;
          line-height: 24px;
          font-size: 16px;
        `
      },
      handleKeyDown: (view, event) => {
        // Handle page navigation with keyboard
        if (event.key === 'PageDown' || (event.ctrlKey && event.key === 'ArrowDown')) {
          event.preventDefault();
          goToNextPage();
          return true;
        }
        if (event.key === 'PageUp' || (event.ctrlKey && event.key === 'ArrowUp')) {
          event.preventDefault();
          goToPrevPage();
          return true;
        }
        return false;
      }
    },
  });

  // Split content into pages based on estimated height
  const splitContentIntoPages = useCallback((content: string): PageData[] => {
    if (!content?.trim()) {
      return [{
        id: '1',
        content: '',
        wordCount: 0
      }];
    }

    // Parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
    const elements = Array.from(doc.querySelector('div')?.children || []);
    
    const newPages: PageData[] = [];
    let currentPageContent = '';
    let currentPageHeight = 0;
    let pageId = 1;

    // Estimate line height and page capacity
    const lineHeight = 24; // pixels
    const linesPerPage = Math.floor(CONTENT_HEIGHT / lineHeight) - 5; // Buffer for margins
    const wordsPerLine = 8; // Average Arabic words per line
    const wordsPerPage = linesPerPage * wordsPerLine;

    let currentWordCount = 0;

    for (const element of elements) {
      const elementText = element.textContent || '';
      const elementWords = elementText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      // Check if adding this element would exceed page capacity
      if (currentWordCount + elementWords > wordsPerPage && currentPageContent) {
        // Finalize current page
        const plainText = currentPageContent.replace(/<[^>]*>/g, '').trim();
        const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
        
        newPages.push({
          id: pageId.toString(),
          content: currentPageContent.trim(),
          wordCount
        });

        // Start new page
        pageId++;
        currentPageContent = element.outerHTML;
        currentWordCount = elementWords;
      } else {
        currentPageContent += element.outerHTML;
        currentWordCount += elementWords;
      }
    }

    // Add the last page if there's content
    if (currentPageContent.trim()) {
      const plainText = currentPageContent.replace(/<[^>]*>/g, '').trim();
      const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
      
      newPages.push({
        id: pageId.toString(),
        content: currentPageContent.trim(),
        wordCount
      });
    }

    return newPages.length > 0 ? newPages : [{
      id: '1',
      content: '',
      wordCount: 0
    }];
  }, []);

  // Handle content changes
  const handleContentChange = useCallback((content: string) => {
    // Calculate word count
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    setTotalWordCount(words.length);
    
    // Split into pages
    const newPages = splitContentIntoPages(content);
    setPages(newPages);
    
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
  }, [onContentChange, autoSave, onSave, autoSaveInterval, splitContentIntoPages]);

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      // Create new page if at the end
      addNewPage();
    }
  }, [currentPageIndex, pages.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [currentPageIndex]);

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPageIndex(pageIndex);
    }
  }, [pages.length]);

  // Add new page
  const addNewPage = useCallback(() => {
    const newPage: PageData = {
      id: `${Date.now()}`,
      content: '',
      wordCount: 0
    };
    
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length); // Focus on the new page
  }, [pages.length]);

  // Remove page
  const removePage = useCallback((pageIndex: number) => {
    if (pages.length <= 1) return; // Don't remove the last page
    
    setPages(prev => prev.filter((_, index) => index !== pageIndex));
    
    // Adjust current page index
    if (currentPageIndex >= pageIndex && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [pages.length, currentPageIndex]);

  // Auto-save function
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

  // Manual save function
  const handleManualSave = async () => {
    if (!onSave || isSaving || !mainEditor) return;
    
    const content = mainEditor.getHTML();
    
    try {
      setIsSaving(true);
      await onSave(content);
      setLastSaved(new Date());
      toast.success('تم حفظ المستند بنجاح');
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('فشل في حفظ المستند');
    } finally {
      setIsSaving(false);
    }
  };

  // Print function
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'لم يتم الحفظ بعد';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'تم الحفظ للتو';
    if (diffInSeconds < 3600) return `تم الحفظ منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    return `تم الحفظ منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  };

  // Initialize content
  useEffect(() => {
    if (initialContent && mainEditor) {
      mainEditor.commands.setContent(initialContent);
    }
  }, [initialContent, mainEditor]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getContent: () => mainEditor?.getHTML() || '',
    setContent: (content: string) => {
      mainEditor?.commands.setContent(content);
    },
    focus: () => {
      mainEditor?.commands.focus();
    },
    save: handleManualSave
  }));

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('w-full mx-auto', className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {totalWordCount.toLocaleString('ar')} كلمة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {pages.length.toLocaleString('ar')} صفحة
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
          {!readOnly && (
            <Button
              onClick={addNewPage}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              صفحة جديدة
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">الصفحات</h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all",
                    index === currentPageIndex 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => goToPage(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      صفحة {(index + 1).toLocaleString('ar')}
                    </span>
                    {pages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(index);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {page.wordCount.toLocaleString('ar')} كلمة
                  </div>
                </div>
              ))}
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPageIndex === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                {(currentPageIndex + 1).toLocaleString('ar')} / {pages.length.toLocaleString('ar')}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Editor */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">محرر المشروع</h3>
              <p className="text-sm text-muted-foreground">
                اكتب محتوى مشروعك هنا. سيتم تقسيمه تلقائياً على صفحات A4.
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              {mainEditor && (
                <EditorContent 
                  editor={mainEditor}
                  className="min-h-[600px] p-6 prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[600px]"
                />
              )}
            </div>

            {/* Pages Preview */}
            <div className="mt-6 space-y-4">
              <h4 className="text-md font-semibold">معاينة الصفحات</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                {pages.map((page, index) => (
                  <Card
                    key={page.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      index === currentPageIndex 
                        ? "ring-2 ring-primary border-primary" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => goToPage(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        صفحة {(index + 1).toLocaleString('ar')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {page.wordCount.toLocaleString('ar')} كلمة
                      </span>
                    </div>
                    
                    <div 
                      className="bg-white border rounded text-xs p-2 min-h-[120px] overflow-hidden"
                      style={{
                        direction: 'rtl',
                        textAlign: 'right',
                        fontFamily: 'Arial, Tahoma, sans-serif',
                        lineHeight: '1.2'
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ 
                          __html: page.content || '<p>صفحة فارغة</p>' 
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: rtl;
            text-align: right;
            font-size: 16px;
            line-height: 24px;
          }
          
          .prose {
            max-width: none !important;
          }
          
          .prose * {
            direction: rtl !important;
            text-align: right !important;
          }

          /* Hide everything except pages during print */
          .lg\\:col-span-1,
          .flex.items-center.justify-between.mb-4 {
            display: none !important;
          }
          
          /* Make pages break properly */
          .space-y-6 > * {
            page-break-after: always;
            margin: 0 !important;
          }
          
          .space-y-6 > *:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
});

MultiPageDocumentEditor.displayName = 'MultiPageDocumentEditor';

export default MultiPageDocumentEditor;