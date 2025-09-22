import React, { useRef, useEffect } from 'react';

interface Page {
  id: string;
  content: string;
}

interface SmartA4ContainerProps {
  pages: Page[];
  currentPageIndex: number;
  onContentChange: (pageId: string, content: string) => void;
  onPageRefChange: (pageId: string, element: HTMLElement | null) => void;
  onOverflowCheck: (element: HTMLElement, pageId: string) => void;
  className?: string;
  readOnly?: boolean;
  A4_PAGE_HEIGHT: number;
}

export const SmartA4Container: React.FC<SmartA4ContainerProps> = ({
  pages,
  currentPageIndex,
  onContentChange,
  onPageRefChange,
  onOverflowCheck,
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

  const handleContentChange = (pageId: string, content: string) => {
    onContentChange(pageId, content);
  };

  // Smart input handler with debounced overflow checking
  const handleInput = (e: React.FormEvent<HTMLDivElement>, pageId: string) => {
    const target = e.currentTarget;
    const content = target.innerHTML;
    
    // Update content immediately
    handleContentChange(pageId, content);
    
    // Check for overflow (debounced)
    onOverflowCheck(target, pageId);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent, pageId: string) => {
    // Handle Enter key naturally - no special page break logic
    if (e.key === 'Enter') {
      // Let browser handle normally
      return;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`smart-a4-container space-y-8 max-h-[80vh] overflow-y-auto p-4 bg-gray-100 ${className}`}
    >
      {pages.map((page, index) => (
        <div
          key={page.id}
          data-page-id={page.id}
          ref={(el) => onPageRefChange(page.id, el)}
          className={`
            a4-page bg-white shadow-lg mx-auto relative
            border border-gray-300 rounded-sm transition-all duration-300
            ${index === currentPageIndex ? 'ring-2 ring-primary scale-[1.02]' : 'hover:shadow-xl'}
          `}
          style={{
            width: '816px', // Microsoft Word A4 width (8.5in = 816px at 96 DPI)
            height: '1056px', // Microsoft Word A4 height (11in = 1056px at 96 DPI)
            minHeight: '1056px',
            maxHeight: '1056px',
            overflow: 'hidden',
          }}
        >
          {/* Page number indicator */}
          <div className="absolute top-2 right-4 text-xs text-muted-foreground bg-background px-2 py-1 rounded shadow-sm border z-10">
            صفحة {index + 1} من {pages.length}
          </div>

          {/* Editable content area */}
          <div
            contentEditable={!readOnly}
            suppressContentEditableWarning={true}
            onInput={(e) => handleInput(e, page.id)}
            onPaste={handlePaste}
            onKeyDown={(e) => handleKeyDown(e, page.id)}
            className="w-full outline-none cursor-text transition-colors duration-200 focus:bg-white focus:ring-2 focus:ring-primary/20"
            style={{
              width: '794px',
              height: '1123px',
              padding: '96px', // Precise Word-standard margins (2.54cm = 96px at 96 DPI)
              wordWrap: 'break-word',
              hyphens: 'auto',
              direction: 'rtl',
              textAlign: 'right',
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: '"Times New Roman", serif',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Visual page break indicator */}
          {index < pages.length - 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary/40" />
          )}
        </div>
      ))}

      <style>{`
        /* Enhanced A4 page styling */
        .a4-page {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: white !important;
        }
        
        .a4-page:hover {
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        /* Print optimization */
        @media print {
          .smart-a4-container {
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
            transform: none !important;
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

        /* Text flow optimization */
        .a4-page [contenteditable] {
          overflow-wrap: break-word;
          word-break: break-word;
          box-sizing: border-box;
          line-break: auto;
        }

        /* Custom scrollbar */
        .smart-a4-container::-webkit-scrollbar {
          width: 8px;
        }

        .smart-a4-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .smart-a4-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #c1c1c1, #a8a8a8);
          border-radius: 4px;
        }

        .smart-a4-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a8a8a8, #888);
        }

        /* Focus improvements */
        .a4-page [contenteditable]:focus {
          outline: none;
          box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        /* Better typography */
        .a4-page [contenteditable] p {
          margin-bottom: 0.5em;
        }

        .a4-page [contenteditable] h1,
        .a4-page [contenteditable] h2,
        .a4-page [contenteditable] h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
};