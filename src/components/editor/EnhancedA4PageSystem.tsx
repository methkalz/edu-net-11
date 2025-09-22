import React, { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface EnhancedA4PageSystemProps {
  children: React.ReactNode;
  className?: string;
  zoom?: number;
  showRulers?: boolean;
  showMargins?: boolean;
  showPageNumbers?: boolean;
  onPageCountChange?: (count: number) => void;
}

export const EnhancedA4PageSystem = forwardRef<HTMLDivElement, EnhancedA4PageSystemProps>(
  ({ 
    children, 
    className,
    zoom = 0.8,
    showRulers = false,
    showMargins = true,
    showPageNumbers = true,
    onPageCountChange
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    
    // أبعاد Microsoft Word الدقيقة لصفحة A4
    const A4_WIDTH = 816; // 8.5 بوصة في 96 DPI (مثل Word تماماً)
    const A4_HEIGHT = 1056; // 11 بوصة في 96 DPI (مثل Word تماماً)
    const MARGIN = 96; // 1 بوصة هوامش (افتراضي Word)
    
    const scaledWidth = A4_WIDTH * zoom;
    const scaledHeight = A4_HEIGHT * zoom;
    const scaledMargin = MARGIN * zoom;

    // حساب عدد الصفحات بدقة محسنة
    const calculatePageCount = useCallback(() => {
      if (!contentRef.current) return 1;
      
      const content = contentRef.current.querySelector('.ProseMirror');
      if (!content) return 1;
      
      const contentHeight = content.scrollHeight;
      const availableHeight = A4_HEIGHT - (MARGIN * 2);
      
      const pages = Math.max(1, Math.ceil(contentHeight / availableHeight));
      return Math.min(pages, 100); // حد أقصى 100 صفحة
    }, []);

    // تحديث عدد الصفحات مع debouncing محسن
    const updatePageCount = useCallback(() => {
      const newPageCount = calculatePageCount();
      if (newPageCount !== pageCount) {
        setPageCount(newPageCount);
        onPageCountChange?.(newPageCount);
      }
    }, [calculatePageCount, pageCount, onPageCountChange]);

    // مراقبة تغييرات المحتوى
    useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updatePageCount, 200);
      };

      const resizeObserver = new ResizeObserver(debouncedUpdate);
      const mutationObserver = new MutationObserver(debouncedUpdate);
      
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
        mutationObserver.observe(contentRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, [updatePageCount]);

    // إنشاء مؤشرات الصفحات المرئية
    const pageIndicators = Array.from({ length: pageCount }, (_, i) => i + 1);

    return (
      <div 
        ref={ref}
        className={cn(
          "enhanced-a4-container bg-gradient-to-b from-gray-50 to-gray-100",
          "overflow-auto h-full relative",
          className
        )}
      >
        {/* خلفية الصفحات */}
        <div 
          className="relative mx-auto py-8"
          style={{ width: scaledWidth + 40 }}
        >
          {/* الصفحات المرئية */}
          <div className="relative space-y-6">
            {pageIndicators.map((pageNum) => (
              <Card
                key={pageNum}
                className={cn(
                  "page-shadow bg-white relative mx-auto overflow-hidden",
                  "border border-gray-200/50 transition-all duration-200",
                  "hover:shadow-xl hover:border-primary/20"
                )}
                style={{
                  width: scaledWidth,
                  height: scaledHeight,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center'
                }}
              >
                {/* الهوامش المرئية المحسنة مثل Word */}
                {showMargins && (
                  <>
                    {/* الهامش العلوي */}
                    <div 
                      className="absolute top-0 left-0 right-0 bg-blue-50/40 border-b-2 border-dashed border-blue-300/60 flex items-center justify-center"
                      style={{ height: scaledMargin }}
                    >
                      <span className="text-xs text-blue-500/70 font-medium">هامش علوي</span>
                    </div>
                    {/* الهامش السفلي */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-50/40 border-t-2 border-dashed border-blue-300/60 flex items-center justify-center"
                      style={{ height: scaledMargin }}
                    >
                      <span className="text-xs text-blue-500/70 font-medium">هامش سفلي</span>
                    </div>
                    {/* الهامش الأيمن */}
                    <div 
                      className="absolute top-0 right-0 bottom-0 bg-blue-50/40 border-l-2 border-dashed border-blue-300/60 flex items-center justify-center"
                      style={{ width: scaledMargin }}
                    >
                      <span className="text-xs text-blue-500/70 font-medium transform rotate-90">هامش أيمن</span>
                    </div>
                    {/* الهامش الأيسر */}
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-blue-50/40 border-r-2 border-dashed border-blue-300/60 flex items-center justify-center"
                      style={{ width: scaledMargin }}
                    >
                      <span className="text-xs text-blue-500/70 font-medium transform -rotate-90">هامش أيسر</span>
                    </div>
                    
                    {/* خطوط إرشادية للهوامش */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* الخطوط الأفقية */}
                      <div 
                        className="absolute left-0 right-0 border-b border-dotted border-blue-200/40"
                        style={{ top: scaledMargin }}
                      />
                      <div 
                        className="absolute left-0 right-0 border-t border-dotted border-blue-200/40"
                        style={{ bottom: scaledMargin }}
                      />
                      {/* الخطوط العمودية */}
                      <div 
                        className="absolute top-0 bottom-0 border-r border-dotted border-blue-200/40"
                        style={{ left: scaledMargin }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 border-l border-dotted border-blue-200/40"
                        style={{ right: scaledMargin }}
                      />
                    </div>
                  </>
                )}
                
                {/* رقم الصفحة */}
                {showPageNumbers && (
                  <div 
                    className="absolute text-xs text-gray-500 font-medium select-none"
                    style={{
                      bottom: scaledMargin / 3,
                      right: scaledMargin,
                    }}
                  >
                    صفحة {pageNum.toLocaleString('ar')}
                  </div>
                )}

                {/* خط فاصل الصفحة */}
                {pageNum < pageCount && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
                    <div className="text-xs text-center text-primary/60 mt-1 font-medium">
                      فاصل الصفحة
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* المحتوى المطلق مع مراعاة الهوامش الدقيقة */}
          <div 
            ref={contentRef}
            className="absolute z-10"
            style={{
              top: `${32 + scaledMargin}px`, // 32px offset للحاوي + هامش علوي
              left: `${20 + scaledMargin}px`, // 20px offset للحاوي + هامش أيسر
              right: `${20 + scaledMargin}px`, // 20px offset للحاوي + هامش أيمن
              width: `${scaledWidth - (40 + scaledMargin * 2)}px` // العرض مطروحاً منه الهوامش
            }}
          >
            <div className="enhanced-editor-content">
              {children}
            </div>
          </div>
        </div>

        {/* مؤشر الصفحة الحالية */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <Card className="px-4 py-2 bg-white/95 backdrop-blur-sm shadow-lg border">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">الصفحة:</span>
              <span className="font-bold text-primary">
                {currentPage.toLocaleString('ar')} من {pageCount.toLocaleString('ar')}
              </span>
            </div>
          </Card>
        </div>

        {/* الأنماط المحسنة */}
        <style>{`
          .enhanced-a4-container {
            font-family: 'Cairo', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
          }
          
          .page-shadow {
            box-shadow: 
              0 8px 25px -8px rgba(0, 0, 0, 0.15),
              0 4px 12px -4px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(0, 0, 0, 0.05);
          }
          
          .page-shadow:hover {
            box-shadow: 
              0 12px 35px -8px rgba(0, 0, 0, 0.2),
              0 6px 18px -4px rgba(0, 0, 0, 0.12),
              0 0 0 1px rgba(59, 130, 246, 0.15);
          }
          
          .enhanced-editor-content {
            line-height: 1.6;
            direction: rtl;
            text-align: right;
            padding: 0; /* إزالة الحشو لإظهار الهوامش بوضوح */
          }
          
          .enhanced-editor-content .ProseMirror {
            outline: none;
            min-height: 200px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            padding: 0; /* إزالة الهوامش في وضع معاينة الصفحات لأنها مضبوطة بالموضع المطلق */
            margin: 0;
            background: transparent;
            border: 1px solid transparent;
            transition: border-color 0.2s ease;
          }
          
          .enhanced-editor-content .ProseMirror:focus {
            border-color: rgba(59, 130, 246, 0.3);
            background: rgba(255, 255, 255, 0.8);
          }
          
          .enhanced-editor-content .ProseMirror p {
            margin: 0 0 1em 0;
            word-wrap: break-word;
          }
          
          .enhanced-editor-content .ProseMirror h1,
          .enhanced-editor-content .ProseMirror h2,
          .enhanced-editor-content .ProseMirror h3,
          .enhanced-editor-content .ProseMirror h4,
          .enhanced-editor-content .ProseMirror h5,
          .enhanced-editor-content .ProseMirror h6 {
            margin: 1.2em 0 0.6em 0;
            font-weight: bold;
            word-wrap: break-word;
          }
          
          .enhanced-editor-content .ProseMirror ul,
          .enhanced-editor-content .ProseMirror ol {
            padding-right: 1.5em;
            margin: 0.5em 0;
          }
          
          .enhanced-editor-content .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
          }
          
          @media print {
            .enhanced-a4-container {
              background: white !important;
              overflow: visible !important;
            }
            
            .page-shadow {
              box-shadow: none !important;
              page-break-after: always;
            }
            
            .page-shadow:last-child {
              page-break-after: avoid;
            }
            
            .enhanced-editor-content {
              font-size: 12pt;
              line-height: 1.5;
            }
          }
        `}</style>
      </div>
    );
  }
);

EnhancedA4PageSystem.displayName = 'EnhancedA4PageSystem';

export default EnhancedA4PageSystem;