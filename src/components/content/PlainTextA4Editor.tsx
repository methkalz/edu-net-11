import React, { useState, useEffect, useImperativeHandle, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Printer, Save } from 'lucide-react';

interface Page {
  id: string;
  content: string;
}

export interface PlainTextA4EditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  save: () => Promise<void>;
}

interface PlainTextA4EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
}

const PlainTextA4Editor = React.forwardRef<PlainTextA4EditorRef, PlainTextA4EditorProps>(({
  initialContent = '',
  onContentChange,
  onSave,
  readOnly = false,
  autoSave = false,
  autoSaveInterval = 30000,
  className = ''
}, ref) => {
  const [pages, setPages] = useState<Page[]>([{ id: '1', content: '' }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // حفظ موضع المؤشر
  const cursorPositionRef = useRef<{pageIndex: number, offset: number} | null>(null);
  const { toast } = useToast();
  
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // دوال حفظ واستعادة موضع المؤشر
  const saveCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const pageElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement?.closest('[data-page-index]')
        : range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element).closest('[data-page-index]')
        : null;
      
      if (pageElement) {
        const pageIndex = parseInt(pageElement.getAttribute('data-page-index') || '0', 10);
        const contentDiv = pageElement.querySelector('.page-content');
        if (contentDiv) {
          const textContent = contentDiv.textContent || '';
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(contentDiv);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          const offset = preCaretRange.toString().length;
          cursorPositionRef.current = { pageIndex, offset };
        }
      }
    }
  }, []);

  const restoreCursorPosition = useCallback(() => {
    if (!cursorPositionRef.current) return;
    
    setTimeout(() => {
      const { pageIndex, offset } = cursorPositionRef.current!;
      const pageElement = document.querySelector(`[data-page-index="${pageIndex}"]`);
      const contentDiv = pageElement?.querySelector('.page-content') as HTMLElement;
      
      if (contentDiv) {
        contentDiv.focus();
        const textContent = contentDiv.textContent || '';
        const actualOffset = Math.min(offset, textContent.length);
        
        try {
          const range = document.createRange();
          const selection = window.getSelection();
          let currentOffset = 0;
          let found = false;
          
          const findTextNode = (node: Node): void => {
            if (found) return;
            
            if (node.nodeType === Node.TEXT_NODE) {
              const textLength = node.textContent?.length || 0;
              if (currentOffset + textLength >= actualOffset) {
                const offsetInNode = actualOffset - currentOffset;
                range.setStart(node, offsetInNode);
                range.collapse(true);
                found = true;
              } else {
                currentOffset += textLength;
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              for (const child of Array.from(node.childNodes)) {
                findTextNode(child);
                if (found) break;
              }
            }
          };
          
          findTextNode(contentDiv);
          
          if (found) {
            selection?.removeAllRanges();
            selection?.addRange(range);
          } else {
            // fallback: وضع المؤشر في النهاية
            range.selectNodeContents(contentDiv);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        } catch (error) {
          console.warn('Error restoring cursor position:', error);
          contentDiv.focus();
        }
      }
      
      cursorPositionRef.current = null;
    }, 0);
  }, []);

  // Microsoft Word A4 dimensions with Word-like margins
  const A4_WIDTH = 816; // 8.5 inches at 96 DPI (Word standard)
  const A4_HEIGHT = 1056; // 11 inches at 96 DPI (Word standard)
  const PAGE_PADDING = 95; // 2.5cm margins like MS Word default
  const LINE_HEIGHT = 24; // ارتفاع مناسب للنص العربي
  const CHARS_PER_LINE = 65; // عدد أحرف مناسب مع الهوامش الجديدة
  const LINES_PER_PAGE = Math.floor((A4_HEIGHT - PAGE_PADDING * 2) / LINE_HEIGHT);
  const CHARS_PER_PAGE = CHARS_PER_LINE * LINES_PER_PAGE;

  // حساب عدد الكلمات
  const calculateWordCount = useCallback((text: string) => {
    const arabicWords = text.match(/[\u0600-\u06FF]+/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return arabicWords.length + englishWords.length;
  }, []);

  // تقسيم النص إلى صفحات بناءً على عدد الأحرف
  const splitTextIntoPages = useCallback((text: string): Page[] => {
    if (!text.trim()) {
      return [{ id: '1', content: '' }];
    }

    const pages: Page[] = [];
    let remainingText = text;
    let pageIndex = 1;

    while (remainingText.length > 0) {
      let pageContent = '';
      
      if (remainingText.length <= CHARS_PER_PAGE) {
        // النص المتبقي يصلح لصفحة واحدة
        pageContent = remainingText;
        remainingText = '';
      } else {
        // نحتاج لتقسيم النص
        let cutPoint = CHARS_PER_PAGE;
        
        // البحث عن أفضل نقطة قطع (مسافة أو سطر جديد)
        const nearbySpace = remainingText.lastIndexOf(' ', cutPoint);
        const nearbyNewline = remainingText.lastIndexOf('\n', cutPoint);
        
        if (nearbyNewline > cutPoint - 100) {
          cutPoint = nearbyNewline + 1;
        } else if (nearbySpace > cutPoint - 100) {
          cutPoint = nearbySpace + 1;
        }
        
        pageContent = remainingText.substring(0, cutPoint).trim();
        remainingText = remainingText.substring(cutPoint).trim();
      }

      pages.push({
        id: pageIndex.toString(),
        content: pageContent
      });
      
      pageIndex++;
    }

    return pages.length > 0 ? pages : [{ id: '1', content: '' }];
  }, []);

  // دمج محتوى كل الصفحات
  const getCombinedContent = useCallback(() => {
    return pages.map(page => page.content).join('\n\n').trim();
  }, [pages]);

  // معالجة تغيير محتوى الصفحة
  const handlePageContentChange = useCallback((pageIndex: number, newContent: string) => {
    setPages(prevPages => {
      const updatedPages = [...prevPages];
      updatedPages[pageIndex] = { ...updatedPages[pageIndex], content: newContent };
      
      // إعادة تقسيم كل المحتوى
      const allContent = updatedPages.map(p => p.content).join('\n\n');
      const rebalancedPages = splitTextIntoPages(allContent);
      
      return rebalancedPages;
    });
  }, [splitTextIntoPages]);

  // تحويل HTML إلى نص عادي للحفاظ على سطور جديدة
  const htmlToPlainText = useCallback((html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // تحويل العناصر إلى سطور جديدة
    const brs = tempDiv.querySelectorAll('br');
    brs.forEach(br => br.replaceWith('\n'));
    
    const divs = tempDiv.querySelectorAll('div');
    divs.forEach((div, index) => {
      if (index > 0) div.insertAdjacentText('beforebegin', '\n');
      div.replaceWith(...Array.from(div.childNodes));
    });
    
    return tempDiv.textContent || '';
  }, []);

  // تحويل النص العادي إلى HTML للعرض
  const plainTextToHtml = useCallback((text: string): string => {
    return text.replace(/\n/g, '<br>');
  }, []);

  // معالجة الإدخال مع حفظ واستعادة موضع المؤشر
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>, pageIndex: number) => {
    // تحويل HTML إلى نص عادي قبل التقسيم
    const htmlContent = e.currentTarget.innerHTML || '';
    const plainTextContent = htmlToPlainText(htmlContent);
    handlePageContentChange(pageIndex, plainTextContent);
  }, [handlePageContentChange, htmlToPlainText]);

  // معالجة اللصق مع حفظ واستعادة موضع المؤشر
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>, pageIndex: number) => {
    e.preventDefault();
    saveCursorPosition();
    const text = e.clipboardData.getData('text/plain');
    
    // إدراج النص في موضع المؤشر الحالي
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
    
    // تحديث المحتوى
    const newContent = e.currentTarget.textContent || '';
    handlePageContentChange(pageIndex, newContent);
  }, [handlePageContentChange, saveCursorPosition]);

  // معالجة الضغط على المفاتيح
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, pageIndex: number) => {
    // السماح للـ Enter بالعمل بشكل طبيعي
    if (e.key === 'Enter') {
      // لا نحفظ موضع المؤشر هنا - سنتركه لـ handleInput
      return; // السماح للسلوك الافتراضي
    }
    
    // التنقل بين الصفحات بـ Page Up/Down
    if (e.key === 'PageDown' && pageIndex < pages.length - 1) {
      e.preventDefault();
      const nextPageRef = pageRefs.current[pageIndex + 1];
      if (nextPageRef) {
        nextPageRef.focus();
        setCurrentPageIndex(pageIndex + 1);
      }
    } else if (e.key === 'PageUp' && pageIndex > 0) {
      e.preventDefault();
      const prevPageRef = pageRefs.current[pageIndex - 1];
      if (prevPageRef) {
        prevPageRef.focus();
        setCurrentPageIndex(pageIndex - 1);
      }
    }
  }, [pages.length, saveCursorPosition]);

  // إضافة صفحة جديدة
  const addNewPage = useCallback(() => {
    const newPageId = (pages.length + 1).toString();
    setPages(prev => [...prev, { id: newPageId, content: '' }]);
    
    // التركيز على الصفحة الجديدة
    setTimeout(() => {
      const newPageRef = pageRefs.current[pages.length];
      if (newPageRef) {
        newPageRef.focus();
        setCurrentPageIndex(pages.length);
      }
    }, 100);
  }, [pages.length]);

  // حفظ المحتوى
  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      const content = getCombinedContent();
      await onSave(content);
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المستند بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ المستند",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, isSaving, getCombinedContent, toast]);

  // طباعة المحتوى
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // تحديث عدد الكلمات عند تغيير المحتوى
  useEffect(() => {
    const content = getCombinedContent();
    setWordCount(calculateWordCount(content));
    onContentChange?.(content);
  }, [pages, getCombinedContent, calculateWordCount, onContentChange]);

  // استعادة موضع المؤشر بعد تحديث الصفحات
  useEffect(() => {
    if (cursorPositionRef.current) {
      restoreCursorPosition();
    }
  }, [pages, restoreCursorPosition]);

  // تحميل المحتوى الأولي
  useEffect(() => {
    if (initialContent && initialContent.trim()) {
      const initialPages = splitTextIntoPages(initialContent);
      setPages(initialPages);
    }
  }, [initialContent, splitTextIntoPages]);

  // الحفظ التلقائي
  useEffect(() => {
    if (autoSave && onSave) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setInterval(() => {
        handleSave();
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSave, onSave, autoSaveInterval, handleSave]);

  // Imperative handle للمرجع
  useImperativeHandle(ref, () => ({
    getContent: getCombinedContent,
    setContent: (content: string) => {
      const newPages = splitTextIntoPages(content);
      setPages(newPages);
    },
    focus: () => {
      const firstPageRef = pageRefs.current[0];
      if (firstPageRef) {
        firstPageRef.focus();
      }
    },
    save: handleSave
  }), [getCombinedContent, splitTextIntoPages, handleSave]);

  return (
    <div className={`plain-text-a4-editor ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {pages.length} صفحة • {wordCount.toLocaleString('ar')} كلمة
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addNewPage}
            disabled={readOnly}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة صفحة
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
          
          {onSave && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || readOnly}
            >
              <Save className="h-4 w-4 ml-2" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          )}
        </div>
      </div>

      {/* Pages Container */}
      <div className="pages-container overflow-auto max-h-[80vh] bg-muted/30 p-8">
        <div className="pages-wrapper flex flex-col items-center gap-8">
          {pages.map((page, index) => (
            <Card 
              key={page.id}
              data-page-index={index}
              className="page-card relative bg-background shadow-lg"
              style={{
                width: `${A4_WIDTH}px`,
                minHeight: `${A4_HEIGHT}px`,
                padding: `${PAGE_PADDING}px`,
                position: 'relative',
              }}
            >
              {/* Single subtle margin indicator - only on focus */}
              <div 
                className="absolute pointer-events-none opacity-0 transition-opacity duration-300 page-margin-indicator border border-primary/15"
                style={{ 
                  left: `${PAGE_PADDING - 1}px`, 
                  top: `${PAGE_PADDING - 1}px`, 
                  right: `${PAGE_PADDING - 1}px`,
                  bottom: `${PAGE_PADDING - 1}px`
                }}
              />
              {/* Page Content */}
              <div
                ref={(el) => {
                  if (el) {
                    pageRefs.current[index] = el;
                    // تحويل النص العادي إلى HTML للعرض
                    const htmlContent = plainTextToHtml(page.content);
                    if (el.innerHTML !== htmlContent) {
                      el.innerHTML = htmlContent;
                    }
                  }
                }}
                className="page-content w-full h-full outline-none text-foreground arabic-text-optimized"
                style={{
                  minHeight: `${A4_HEIGHT - PAGE_PADDING * 2}px`,
                  lineHeight: '24px',
                  fontSize: '16px',
                  fontFamily: "'Arial', 'Tahoma', sans-serif",
                  textAlign: 'right',
                  direction: 'rtl',
                  padding: '0',
                  margin: '0',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  border: 'none',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }}
                contentEditable={!readOnly}
                suppressContentEditableWarning={true}
                onInput={(e) => handleInput(e, index)}
                onPaste={(e) => handlePaste(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setCurrentPageIndex(index)}
              />
              
              {/* Page Number */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
                صفحة {(index + 1).toLocaleString('ar')}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      {lastSaved && (
        <div className="flex items-center justify-center p-2 text-xs text-muted-foreground bg-background/95 border-t border-border">
          آخر حفظ: {lastSaved.toLocaleString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      )}

      {/* Enhanced Styles for Arabic Text */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .arabic-text-optimized {
            font-feature-settings: "liga" 1, "kern" 1;
            font-variant-ligatures: common-ligatures;
            text-rendering: auto;
            -webkit-font-smoothing: subpixel-antialiased;
            -moz-osx-font-smoothing: auto;
          }
          
          .arabic-text-optimized p {
            margin: 0.5em 0;
            text-indent: 0;
          }
          
          .arabic-text-optimized:focus {
            outline: 1px solid hsl(var(--primary) / 0.2);
            outline-offset: 1px;
          }
          
          .page-card:focus-within .page-margin-indicator {
            opacity: 1 !important;
          }
          
          @media print {
            .plain-text-a4-editor .flex:first-child,
            .plain-text-a4-editor .flex:last-child {
              display: none !important;
            }
            
            .pages-container {
              background: white !important;
              padding: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
            
            .pages-wrapper {
              gap: 0 !important;
            }
            
            .page-card {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              page-break-after: always;
              width: 8.5in !important;
              height: 11in !important;
              padding: 15mm !important;
            }
            
            .page-card:last-child {
              page-break-after: avoid;
            }
            
            .page-content {
              font-size: 14pt !important;
              line-height: 1.6 !important;
              color: black !important;
              text-align: justify !important;
              font-family: "Noto Sans Arabic", "Cairo", "Amiri", "Tahoma", serif !important;
            }
            
            .arabic-text-optimized {
              text-justify: inter-word !important;
              word-spacing: 0.1em !important;
              letter-spacing: 0.02em !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `
      }} />
    </div>
  );
});

PlainTextA4Editor.displayName = 'PlainTextA4Editor';

export default PlainTextA4Editor;