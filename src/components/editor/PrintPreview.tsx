import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintPreviewProps {
  editor: Editor;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  editor,
  title = "مستند جديد",
  isOpen,
  onClose,
  className
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  // إنشاء HTML للطباعة
  const createPrintHTML = () => {
    const content = editor.getHTML();
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        @page {
            size: A4;
            margin: 2.54cm;
        }
        
        body {
            font-family: 'Cairo', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            font-size: 12pt;
            color: #000;
            background: white;
            margin: 0;
            padding: 20px;
            max-width: 8.5in;
            min-height: 11in;
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-weight: bold;
            margin: 1em 0 0.5em 0;
            page-break-after: avoid;
            break-after: avoid-page;
        }
        
        h1 { font-size: 18pt; }
        h2 { font-size: 16pt; }
        h3 { font-size: 14pt; }
        h4 { font-size: 13pt; }
        h5 { font-size: 12pt; }
        h6 { font-size: 11pt; }
        
        p {
            margin: 0 0 1em 0;
            text-align: inherit;
            orphans: 2;
            widows: 2;
            page-break-inside: avoid;
        }
        
        ul, ol {
            margin: 1em 0;
            padding-right: 2em;
            page-break-inside: avoid;
        }
        
        li {
            margin: 0.5em 0;
            page-break-inside: avoid;
        }
        
        img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
            display: block;
            margin: 1em auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: right;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        strong, b {
            font-weight: bold;
        }
        
        em, i {
            font-style: italic;
        }
        
        u {
            text-decoration: underline;
        }
        
        /* إعدادات محددة للطباعة */
        @media print {
            body {
                margin: 0 !important;
                padding: 0 !important;
                font-size: 12pt !important;
            }
            
            h1, h2, h3, h4, h5, h6, p, li {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            img, table {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
        
        /* عرض أثناء المعاينة */
        @media screen {
            body {
                padding: 40px;
                background: #f5f5f5;
                min-height: calc(297mm - 80px);
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 20px auto;
                transform: scale(${zoom / 100});
                transform-origin: top center;
            }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
  };

  // تحديث محتوى iframe
  useEffect(() => {
    if (isOpen && iframeRef.current && editor) {
      setIsLoading(true);
      
      const iframe = iframeRef.current;
      const printHTML = createPrintHTML();
      
      // كتابة المحتوى إلى iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printHTML);
        iframeDoc.close();
        
        // انتظار تحميل المحتوى
        iframe.onload = () => {
          setIsLoading(false);
        };
      }
    }
  }, [isOpen, editor, title, zoom]);

  // معالجة الطباعة
  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  // تعديل مستوى التكبير
  const handleZoomIn = () => {
    setZoom(prev => Math.min(200, prev + 25));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(50, prev - 25));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
      "flex flex-col",
      className
    )}>
      {/* شريط الأدوات العلوي */}
      <Card className="m-4 mb-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">معاينة الطباعة - {title}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* أدوات التكبير */}
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomReset}
                className="min-w-[60px]"
              >
                {zoom}%
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* أزرار الإجراءات */}
            <Button
              onClick={handlePrint}
              disabled={isLoading}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              إغلاق
            </Button>
          </div>
        </div>
      </Card>

      {/* منطقة المعاينة */}
      <div className="flex-1 overflow-auto bg-gray-100 m-4 mt-0 rounded-lg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">جاري تحضير المعاينة...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 bg-white"
          title="معاينة الطباعة"
          style={{ 
            minHeight: '100%',
            visibility: isLoading ? 'hidden' : 'visible'
          }}
        />
      </div>

      {/* شريط المعلومات السفلي */}
      <Card className="m-4 mt-0">
        <div className="flex items-center justify-between p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>صفحة A4 (210 × 297 مم)</span>
            <span>هوامش: 2.54 سم</span>
            <span>التكبير: {zoom}%</span>
          </div>
          <div>
            <span>اضغط Ctrl+P للطباعة السريعة</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrintPreview;