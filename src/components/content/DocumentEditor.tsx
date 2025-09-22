import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Type,
  Palette,
  Download,
  Upload
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = "ابدأ الكتابة هنا..." 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: '16',
    fontFamily: 'Arial',
    textAlign: 'right'
  });

  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const formatDocument = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertTable = () => {
    const rows = prompt('عدد الصفوف:') || '3';
    const cols = prompt('عدد الأعمدة:') || '3';
    
    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    for (let i = 0; i < parseInt(rows); i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    document.execCommand('insertHTML', false, tableHTML);
    updateContent();
  };

  const insertImage = () => {
    const imageUrl = prompt('أدخل رابط الصورة:');
    if (imageUrl) {
      const imageHTML = `<img src="${imageUrl}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="صورة" />`;
      document.execCommand('insertHTML', false, imageHTML);
      updateContent();
    }
  };

  const exportDocument = () => {
    if (editorRef.current) {
      const docContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              margin: 20px; 
              direction: rtl;
            }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
          </style>
        </head>
        <body>
          ${editorRef.current.innerHTML}
        </body>
        </html>
      `;
      
      const blob = new Blob([docContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* شريط الأدوات */}
      <div className="bg-muted/30 p-3 border-b">
        <div className="flex flex-wrap gap-2 items-center">
          {/* أدوات التنسيق الأساسية */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('bold')}
              className="p-2"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('italic')}
              className="p-2"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('underline')}
              className="p-2"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border"></div>

          {/* حجم وخط النص */}
          <div className="flex gap-2 items-center">
            <Select 
              value={currentFormat.fontFamily}
              onValueChange={(value) => formatDocument('fontName', value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={currentFormat.fontSize}
              onValueChange={(value) => formatDocument('fontSize', value)}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">8pt</SelectItem>
                <SelectItem value="2">10pt</SelectItem>
                <SelectItem value="3">12pt</SelectItem>
                <SelectItem value="4">14pt</SelectItem>
                <SelectItem value="5">18pt</SelectItem>
                <SelectItem value="6">24pt</SelectItem>
                <SelectItem value="7">36pt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border"></div>

          {/* محاذاة النص */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('justifyRight')}
              className="p-2"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('justifyCenter')}
              className="p-2"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('justifyLeft')}
              className="p-2"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border"></div>

          {/* القوائم والعناوين */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('insertUnorderedList')}
              className="p-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('insertOrderedList')}
              className="p-2"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border"></div>

          {/* إدراج عناصر */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={insertTable}
              className="p-2 text-xs"
            >
              جدول
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertImage}
              className="p-2 text-xs"
            >
              صورة
            </Button>
          </div>

          <div className="h-6 w-px bg-border"></div>

          {/* أدوات إضافية */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('undo')}
              className="p-2 text-xs"
            >
              تراجع
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatDocument('redo')}
              className="p-2 text-xs"
            >
              إعادة
            </Button>
          </div>

          <div className="mr-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={exportDocument}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </div>
        </div>
      </div>

      {/* منطقة التحرير */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-6 bg-white outline-none"
        style={{ 
          direction: 'rtl',
          lineHeight: '1.6',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px'
        }}
        onInput={updateContent}
        onBlur={updateContent}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      >
        {!content && (
          <p className="text-muted-foreground">{placeholder}</p>
        )}
      </div>

      {/* شريط الحالة */}
      <div className="bg-muted/30 px-4 py-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>محرر المستندات - يدعم النصوص والجداول والصور</span>
          <span>عدد الكلمات: {content.split(' ').filter(w => w.length > 0).length}</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;