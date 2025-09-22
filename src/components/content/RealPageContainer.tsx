import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// A4 page dimensions in pixels (96 DPI)
const A4_WIDTH = 794; // 21cm at 96 DPI
const A4_HEIGHT = 1123; // 29.7cm at 96 DPI
const PAGE_MARGIN = 76; // 2cm margins
const CONTENT_WIDTH = A4_WIDTH - (PAGE_MARGIN * 2);
const CONTENT_HEIGHT = A4_HEIGHT - (PAGE_MARGIN * 2);

interface PageContent {
  id: string;
  content: string;
  wordCount: number;
}

interface RealPageContainerProps {
  htmlContent: string;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
  className?: string;
}

const RealPageContainer: React.FC<RealPageContainerProps> = ({
  htmlContent,
  readOnly = false,
  onContentChange,
  className
}) => {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [currentEditablePageIndex, setCurrentEditablePageIndex] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Function to measure actual content height
  const measureContentHeight = useCallback((content: string): number => {
    if (!measureRef.current) return 0;
    
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${CONTENT_WIDTH}px;
      direction: rtl;
      text-align: right;
      font-family: 'Arial', 'Tahoma', sans-serif;
      font-size: 16px;
      line-height: 24px;
      padding: 0;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `;
    
    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);
    
    const height = tempDiv.scrollHeight;
    document.body.removeChild(tempDiv);
    
    return height;
  }, []);

  // Function to split content into pages based on actual height
  const splitContentIntoRealPages = useCallback((content: string): PageContent[] => {
    if (!content.trim()) {
      return [{ id: '1', content: '', wordCount: 0 }];
    }

    const totalHeight = measureContentHeight(content);
    
    // If content fits in one page
    if (totalHeight <= CONTENT_HEIGHT) {
      const wordCount = content.replace(/<[^>]*>/g, '').trim()
        .split(/\s+/).filter(word => word.length > 0).length;
      
      return [{
        id: '1',
        content,
        wordCount
      }];
    }

    // Split content into sentences for better page breaks
    const sentences = content.split(/(?<=[.!?،؛])\s+/);
    const newPages: PageContent[] = [];
    let currentPageContent = '';
    let pageId = 1;

    for (let i = 0; i < sentences.length; i++) {
      const testContent = currentPageContent + (currentPageContent ? ' ' : '') + sentences[i];
      const testHeight = measureContentHeight(testContent);

      if (testHeight > CONTENT_HEIGHT && currentPageContent) {
        // Current page is full, finalize it
        const wordCount = currentPageContent.replace(/<[^>]*>/g, '').trim()
          .split(/\s+/).filter(word => word.length > 0).length;
        
        newPages.push({
          id: pageId.toString(),
          content: currentPageContent.trim(),
          wordCount
        });

        // Start new page
        pageId++;
        currentPageContent = sentences[i];
      } else {
        currentPageContent = testContent;
      }
    }

    // Add the last page if there's content
    if (currentPageContent.trim()) {
      const wordCount = currentPageContent.replace(/<[^>]*>/g, '').trim()
        .split(/\s+/).filter(word => word.length > 0).length;
      
      newPages.push({
        id: pageId.toString(),
        content: currentPageContent.trim(),
        wordCount
      });
    }

    return newPages;
  }, [measureContentHeight]);

  // Update pages when content changes
  useEffect(() => {
    const newPages = splitContentIntoRealPages(htmlContent);
    setPages(newPages);
    
    // Update page refs array
    pageRefs.current = new Array(newPages.length).fill(null);
  }, [htmlContent, splitContentIntoRealPages]);

  // Handle content editing in individual pages
  const handlePageEdit = useCallback((pageIndex: number, newContent: string) => {
    if (readOnly) return;

    const updatedPages = [...pages];
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      content: newContent,
      wordCount: newContent.replace(/<[^>]*>/g, '').trim()
        .split(/\s+/).filter(word => word.length > 0).length
    };

    setPages(updatedPages);

    // Combine all pages content and trigger onChange
    const combinedContent = updatedPages.map(page => page.content).join(' ');
    onContentChange?.(combinedContent);

    // Re-split content to handle overflow
    setTimeout(() => {
      const reSplitPages = splitContentIntoRealPages(combinedContent);
      setPages(reSplitPages);
    }, 100);
  }, [pages, readOnly, onContentChange, splitContentIntoRealPages]);

  // Handle key events for page navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, pageIndex: number) => {
    if (readOnly) return;

    // Move to next page on Ctrl+Enter or when reaching end of page
    if ((e.ctrlKey && e.key === 'Enter') || 
        (e.key === 'ArrowDown' && pageIndex < pages.length - 1)) {
      e.preventDefault();
      const nextPageElement = pageRefs.current[pageIndex + 1];
      if (nextPageElement) {
        const editableDiv = nextPageElement.querySelector('[contenteditable]') as HTMLDivElement;
        if (editableDiv) {
          editableDiv.focus();
          setCurrentEditablePageIndex(pageIndex + 1);
        }
      }
    }

    // Move to previous page
    if (e.key === 'ArrowUp' && pageIndex > 0) {
      e.preventDefault();
      const prevPageElement = pageRefs.current[pageIndex - 1];
      if (prevPageElement) {
        const editableDiv = prevPageElement.querySelector('[contenteditable]') as HTMLDivElement;
        if (editableDiv) {
          editableDiv.focus();
          setCurrentEditablePageIndex(pageIndex - 1);
        }
      }
    }
  }, [readOnly, pages.length]);

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* Hidden measuring element */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      />

      {/* Render actual separate pages */}
      {pages.map((page, index) => (
        <Card
          key={page.id}
          ref={(el) => {
            pageRefs.current[index] = el;
          }}
          className="shadow-lg page-container"
        >
          <div
            className="mx-auto bg-white page-content"
            style={{
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
              padding: `${PAGE_MARGIN}px`,
              position: 'relative'
            }}
          >
            <div
              className={cn(
                'page-content-area',
                readOnly ? 'readonly-content' : 'editable-content'
              )}
              style={{
                width: `${CONTENT_WIDTH}px`,
                height: `${CONTENT_HEIGHT}px`,
                overflow: 'hidden',
                direction: 'rtl',
                textAlign: 'right',
                fontFamily: "'Arial', 'Tahoma', sans-serif",
                fontSize: '16px',
                lineHeight: '24px',
                outline: 'none',
                border: 'none',
                padding: '0',
                margin: '0'
              }}
              contentEditable={!readOnly}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: page.content }}
              onInput={(e) => {
                const newContent = e.currentTarget.innerHTML;
                handlePageEdit(index, newContent);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setCurrentEditablePageIndex(index)}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
              }}
            />

            {/* Page number */}
            <div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground pointer-events-none"
              style={{ direction: 'ltr' }}
            >
              صفحة {(index + 1).toLocaleString('ar')} من {pages.length.toLocaleString('ar')}
            </div>

            {/* Current page indicator */}
            {!readOnly && currentEditablePageIndex === index && (
              <div
                className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded pointer-events-none"
                style={{ direction: 'ltr' }}
              >
                الصفحة النشطة
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Page styles */}
      <style>{`
        .page-container {
          page-break-after: always;
          break-after: page;
        }
        
        .page-content {
          position: relative;
        }
        
        .editable-content:focus {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: -2px;
        }
        
        .readonly-content {
          cursor: default;
        }
        
        .page-content-area p {
          margin: 0 0 1em 0;
          line-height: 24px;
        }
        
        .page-content-area h1,
        .page-content-area h2,
        .page-content-area h3,
        .page-content-area h4,
        .page-content-area h5,
        .page-content-area h6 {
          margin: 1em 0 0.5em 0;
          line-height: 1.2;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          .page-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            page-break-after: always;
          }
          
          .page-content {
            margin: 0 !important;
          }
          
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: rtl;
            text-align: right;
          }
        }
        
        @media screen {
          .page-container:not(:last-child) {
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default RealPageContainer;