import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Save, Printer, FileText } from 'lucide-react';

interface Page {
  id: string;
  content: string;
}

interface SimpleA4PageEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
}

export interface SimpleA4PageEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  save: () => Promise<void>;
}

const SimpleA4PageEditor = React.forwardRef<SimpleA4PageEditorRef, SimpleA4PageEditorProps>((props, ref) => {
  // State management
  const [pages, setPages] = useState<Page[]>([{ id: '1', content: '' }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Microsoft Word A4 dimensions in pixels (at 96 DPI)
  const A4_WIDTH = 816; // 8.5 inches at 96 DPI (Word standard)
  const A4_HEIGHT = 1056; // 11 inches at 96 DPI (Word standard)
  const PAGE_PADDING = 60; // 20mm padding
  const CONTENT_HEIGHT = A4_HEIGHT - (PAGE_PADDING * 2);

  // Calculate word count
  const calculateWordCount = useCallback((content: string) => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }, []);

  // Check if page content overflows
  const checkPageOverflow = useCallback((pageElement: HTMLDivElement) => {
    return pageElement.scrollHeight > CONTENT_HEIGHT;
  }, [CONTENT_HEIGHT]);

  // Split content when page overflows
  const handlePageOverflow = useCallback((pageIndex: number) => {
    const pageElement = pageRefs.current[pages[pageIndex].id];
    if (!pageElement || !checkPageOverflow(pageElement)) return;

    const content = pageElement.innerHTML;
    const words = content.split(' ');
    const midPoint = Math.floor(words.length / 2);
    
    const firstHalf = words.slice(0, midPoint).join(' ');
    const secondHalf = words.slice(midPoint).join(' ');

    setPages(prev => {
      const newPages = [...prev];
      newPages[pageIndex] = { ...newPages[pageIndex], content: firstHalf };
      
      // Create new page with overflow content
      const newPage: Page = {
        id: `page-${Date.now()}`,
        content: secondHalf
      };
      
      newPages.splice(pageIndex + 1, 0, newPage);
      return newPages;
    });
  }, [pages, checkPageOverflow]);

  // Handle content change in a page
  const handlePageContentChange = useCallback((pageId: string, content: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, content } : page
    ));

    // Calculate total word count
    const totalContent = pages.map(p => p.id === pageId ? content : p.content).join(' ');
    setWordCount(calculateWordCount(totalContent));

    // Trigger onChange
    if (props.onContentChange) {
      props.onContentChange(totalContent);
    }

    // Check for overflow after a short delay
    setTimeout(() => {
      const pageIndex = pages.findIndex(p => p.id === pageId);
      if (pageIndex !== -1) {
        handlePageOverflow(pageIndex);
      }
    }, 100);
  }, [pages, calculateWordCount, props.onContentChange, handlePageOverflow]);

  // Handle input events
  const handleInput = useCallback((pageId: string) => {
    const pageElement = pageRefs.current[pageId];
    if (pageElement) {
      handlePageContentChange(pageId, pageElement.innerHTML);
    }
  }, [handlePageContentChange]);

  // Handle key navigation between pages
  const handleKeyDown = useCallback((e: React.KeyboardEvent, pageId: string) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    
    if (e.key === 'ArrowDown' && e.ctrlKey && pageIndex < pages.length - 1) {
      e.preventDefault();
      const nextPageElement = pageRefs.current[pages[pageIndex + 1].id];
      nextPageElement?.focus();
      setCurrentPageIndex(pageIndex + 1);
    } else if (e.key === 'ArrowUp' && e.ctrlKey && pageIndex > 0) {
      e.preventDefault();
      const prevPageElement = pageRefs.current[pages[pageIndex - 1].id];
      prevPageElement?.focus();
      setCurrentPageIndex(pageIndex - 1);
    }
  }, [pages]);

  // Add new page
  const addNewPage = useCallback(() => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      content: ''
    };
    setPages(prev => [...prev, newPage]);
  }, []);

  // Save functionality
  const handleSave = useCallback(async () => {
    if (!props.onSave) return;
    
    setIsSaving(true);
    try {
      const fullContent = pages.map(p => p.content).join('\n\n');
      await props.onSave(fullContent);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [pages, props.onSave]);

  // Print functionality
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Initialize content
  useEffect(() => {
    if (props.initialContent) {
      // Split initial content into pages (simple split by paragraphs)
      const paragraphs = props.initialContent.split('\n\n').filter(p => p.trim());
      if (paragraphs.length > 0) {
        const initialPages = paragraphs.map((content, index) => ({
          id: `page-${index + 1}`,
          content: content.trim()
        }));
        setPages(initialPages);
        setWordCount(calculateWordCount(props.initialContent));
      }
    }
  }, [props.initialContent, calculateWordCount]);

  // Auto-save
  useEffect(() => {
    if (props.autoSave && props.onSave) {
      const interval = setInterval(() => {
        handleSave();
      }, props.autoSaveInterval || 30000);
      
      return () => clearInterval(interval);
    }
  }, [props.autoSave, props.autoSaveInterval, handleSave]);

  // Imperative handle
  React.useImperativeHandle(ref, () => ({
    getContent: () => pages.map(p => p.content).join('\n\n'),
    setContent: (content: string) => {
      const newPages = content.split('\n\n').map((pageContent, index) => ({
        id: `page-${index + 1}`,
        content: pageContent.trim()
      }));
      setPages(newPages.length > 0 ? newPages : [{ id: '1', content: '' }]);
    },
    focus: () => {
      const firstPageElement = pageRefs.current[pages[0]?.id];
      firstPageElement?.focus();
    },
    save: handleSave
  }), [pages, handleSave]);

  return (
    <div className={`flex flex-col h-full ${props.className || ''}`} dir="rtl">
      {/* Header */}
      <div className="simple-a4-header flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">محرر النصوص</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {wordCount} كلمة • {pages.length} صفحة
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addNewPage}
            disabled={props.readOnly}
          >
            <Plus className="h-4 w-4 ml-1" />
            إضافة صفحة
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 ml-1" />
            طباعة
          </Button>
          
          {props.onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || props.readOnly}
            >
              <Save className="h-4 w-4 ml-1" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          )}
        </div>
      </div>

      {/* Pages Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-8"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {pages.map((page, index) => (
            <Card 
              key={page.id}
              className="simple-a4-page relative shadow-lg"
              style={{
                width: `${A4_WIDTH}px`,
                minHeight: `${A4_HEIGHT}px`,
                margin: '0 auto'
              }}
            >
              {/* Page Number */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground">
                صفحة {index + 1}
              </div>
              
              {/* Content Area */}
              <div
                ref={(el) => pageRefs.current[page.id] = el}
                contentEditable={!props.readOnly}
                className="w-full h-full outline-none"
                style={{
                  padding: `${PAGE_PADDING}px`,
                  minHeight: `${CONTENT_HEIGHT}px`,
                  maxHeight: `${CONTENT_HEIGHT}px`,
                  overflow: 'hidden',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif'
                }}
                dangerouslySetInnerHTML={{ __html: page.content }}
                onInput={() => handleInput(page.id)}
                onKeyDown={(e) => handleKeyDown(e, page.id)}
                onFocus={() => setCurrentPageIndex(index)}
                suppressContentEditableWarning={true}
              />
            </Card>
          ))}
        </div>
      </div>

      {/* Footer Status */}
      {lastSaved && (
        <div className="simple-a4-footer p-2 text-xs text-muted-foreground text-center border-t bg-muted/30">
          آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .simple-a4-header,
          .simple-a4-footer {
            display: none !important;
          }
          
          .simple-a4-page {
            page-break-after: always;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          .simple-a4-page:last-child {
            page-break-after: auto;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
});

SimpleA4PageEditor.displayName = 'SimpleA4PageEditor';

export default SimpleA4PageEditor;