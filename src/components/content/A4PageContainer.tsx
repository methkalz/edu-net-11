import React, { useRef, useEffect } from 'react';

interface Page {
  id: string;
  content: string;
}

interface A4PageContainerProps {
  pages: Page[];
  currentPageIndex: number;
  onContentChange: (pageId: string, content: string) => void;
  onPageRefChange: (pageId: string, element: HTMLElement | null) => void;
  onAddPage: () => string | null;
  className?: string;
  readOnly?: boolean;
  A4_PAGE_HEIGHT: number;
}

export const A4PageContainer: React.FC<A4PageContainerProps> = ({
  pages,
  currentPageIndex,
  onContentChange,
  onPageRefChange,
  onAddPage,
  className = '',
  readOnly = false,
  A4_PAGE_HEIGHT
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current page
  useEffect(() => {
    if (containerRef.current && currentPageIndex >= 0) {
      const currentPageElement = containerRef.current.children[currentPageIndex] as HTMLElement;
      if (currentPageElement) {
        currentPageElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentPageIndex]);

  // Simple event handler for page overflow - based on Stack Overflow solution
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Only handle if target is contenteditable and in our pages
      if (!target.hasAttribute('contenteditable')) return;
      
      const pageElement = target.closest('[data-page-id]') as HTMLElement;
      if (!pageElement) return;
      
      const pageId = pageElement.getAttribute('data-page-id');
      if (!pageId) return;
      
      // Find current page index
      const pageIndex = pages.findIndex(p => p.id === pageId);
      const isLastPage = pageIndex === pages.length - 1;
      
      if (!isLastPage) return;
      
      // Check if page height exceeds limit
      const currentHeight = target.offsetHeight;
      console.log(`Page ${pageIndex + 1}: height = ${currentHeight}px, limit = ${A4_PAGE_HEIGHT}px`);
      
      if (currentHeight >= A4_PAGE_HEIGHT) {
        console.log('Page overflow detected, creating new page...');
        
        // Create new page
        const newPageId = onAddPage();
        
        if (newPageId) {
          // Focus on new page after creation
          setTimeout(() => {
            const newPageElement = document.querySelector(`[data-page-id="${newPageId}"] [contenteditable]`) as HTMLElement;
            if (newPageElement) {
              newPageElement.focus();
              // Place cursor at beginning
              const range = document.createRange();
              const selection = window.getSelection();
              range.setStart(newPageElement, 0);
              range.collapse(true);
              selection?.removeAllRanges();
              selection?.addRange(range);
              console.log('Focus moved to new page');
            }
          }, 100);
        }
      }
    };

    // Add event listener
    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [pages, onAddPage, A4_PAGE_HEIGHT]);

  const handleContentChange = (pageId: string, content: string) => {
    onContentChange(pageId, content);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div 
      ref={containerRef}
      className={`a4-container space-y-8 max-h-[80vh] overflow-y-auto p-4 bg-gray-100 ${className}`}
    >
      {pages.map((page, index) => (
        <div
          key={page.id}
          data-page-id={page.id}
          ref={(el) => onPageRefChange(page.id, el)}
          className={`
            a4-page bg-white shadow-lg mx-auto relative
            border border-gray-300 rounded-sm
            ${index === currentPageIndex ? 'ring-2 ring-primary' : ''}
          `}
          style={{
            width: '8.5in',      // Word A4 width
            height: `${A4_PAGE_HEIGHT + 50}px`, // Word A4 height + padding
            minHeight: `${A4_PAGE_HEIGHT + 50}px`,
            maxHeight: `${A4_PAGE_HEIGHT + 50}px`,
            overflow: 'hidden',
          }}
        >
          {/* Page number indicator */}
          <div className="absolute top-2 right-4 text-xs text-muted-foreground bg-background px-2 py-1 rounded shadow-sm border z-10">
            صفحة {index + 1} من {pages.length}
          </div>

          {/* Editable content area */}
          <div
            contentEditable={!readOnly && index === pages.length - 1} // Only last page is editable
            suppressContentEditableWarning={true}
            onInput={(e) => handleContentChange(page.id, e.currentTarget.innerHTML)}
            onPaste={handlePaste}
            className={`
              w-full outline-none p-10
              ${readOnly || index < pages.length - 1 ? 'cursor-default bg-gray-50' : 'cursor-text'}
              ${index === pages.length - 1 ? 'focus:bg-white' : ''}
            `}
            style={{
              height: `${A4_PAGE_HEIGHT}px`,
              maxHeight: `${A4_PAGE_HEIGHT}px`,
              wordWrap: 'break-word',
              hyphens: 'auto',
              direction: 'rtl', // RTL support for Arabic
              textAlign: 'right',
              fontSize: '16px',
              lineHeight: '1.8',
              fontFamily: '"Times New Roman", serif',
              overflow: 'hidden',
              paddingTop: '50px', // Space for page number
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Visual indicator for page break */}
          {index < pages.length - 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary/40" />
          )}
        </div>
      ))}

      <style>{`
        .a4-page {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .a4-page:hover {
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        /* Print styles */
        @media print {
          .a4-container {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .a4-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            page-break-after: always;
            width: 8.5in !important;
            height: 11in !important;
            max-height: none !important;
            border-radius: 0 !important;
          }
          
          .a4-page [contenteditable] {
            padding: 25.4mm !important;
            max-height: none !important;
            overflow: visible !important;
          }
          
          .a4-page:last-child {
            page-break-after: auto;
          }

          .absolute {
            display: none !important;
          }
        }

        /* Ensure proper text flow and prevent overflow */
        .a4-page [contenteditable] {
          overflow-wrap: break-word;
          word-break: break-word;
          box-sizing: border-box;
        }

        /* Custom scrollbar for container */
        .a4-container::-webkit-scrollbar {
          width: 8px;
        }

        .a4-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .a4-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .a4-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};