import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportEngineProps {
  editor: Editor;
  documentId?: string;
  title?: string;
}

export const ExportEngine: React.FC<ExportEngineProps> = ({
  editor,
  documentId,
  title = "مستند"
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // تصدير PDF باستخدام Edge Function
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const html = editor.getHTML();
      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim();
      
      const { data, error } = await supabase.functions.invoke('enhanced-pdf-export', {
        body: {
          html,
          title: cleanTitle,
          options: {
            pageSize: 'A4',
            margin: '2.54cm',
            fontSize: '12pt',
            fontFamily: 'Cairo, Arial, sans-serif',
            direction: 'rtl',
            includeStyles: true
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message || 'فشل في إنشاء PDF');

      // تحويل base64 إلى blob وتحميل الملف
      const pdfBlob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      });
      
      saveAs(pdfBlob, `${cleanTitle}.pdf`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير المستند كملف PDF",
      });
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير المستند كملف PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // تصدير Word (.docx)
  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const json = editor.getJSON();
      const paragraphs = await convertTiptapToDocx(json);
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
        styles: {
          default: {
            document: {
              run: {
                font: "Arial",
                size: 24, // 12pt
                // rtl: true,
              },
              paragraph: {
                alignment: AlignmentType.RIGHT,
              }
            }
          }
        }
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim();
      saveAs(blob, `${cleanTitle}.docx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير المستند كملف Word",
      });
    } catch (error) {
      console.error('خطأ في تصدير Word:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير المستند كملف Word",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // تحويل محتوى Tiptap إلى تنسيق docx
  const convertTiptapToDocx = async (content: any): Promise<any[]> => {
    const paragraphs: any[] = [];
    
    if (!content.content) return paragraphs;
    
    for (const node of content.content) {
      if (node.type === 'paragraph') {
        const runs: TextRun[] = [];
        
        if (node.content) {
          for (const textNode of node.content) {
            if (textNode.type === 'text') {
              const textRun = new TextRun({
                text: textNode.text || '',
                bold: textNode.marks?.some((mark: any) => mark.type === 'bold'),
                italics: textNode.marks?.some((mark: any) => mark.type === 'italic'),
                underline: textNode.marks?.some((mark: any) => mark.type === 'underline') ? {} : undefined,
                size: 24, // 12pt
                font: "Arial",
                rightToLeft: true,
              });
              runs.push(textRun);
            }
          }
        }
        
        const paragraph = new Paragraph({
          children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
          alignment: getAlignmentFromAttrs(node.attrs),
          
        });
        
        paragraphs.push(paragraph);
      } else if (node.type === 'heading') {
        const runs: TextRun[] = [];
        
        if (node.content) {
          for (const textNode of node.content) {
            if (textNode.type === 'text') {
              const textRun = new TextRun({
                text: textNode.text || '',
                bold: true,
                size: getHeadingSize(node.attrs?.level || 1),
                font: "Arial",
                rightToLeft: true,
              });
              runs.push(textRun);
            }
          }
        }
        
        const heading = new Paragraph({
          children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
          heading: getHeadingLevel(node.attrs?.level || 1),
          alignment: getAlignmentFromAttrs(node.attrs),
        });
        
        paragraphs.push(heading);
      } else if (node.type === 'bulletList') {
        // معالجة القوائم النقطية
        if (node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const listContent of listItem.content) {
                if (listContent.type === 'paragraph') {
                  const runs: TextRun[] = [new TextRun({ text: '• ' })]; // نقطة
                  
                  if (listContent.content) {
                    for (const textNode of listContent.content) {
                      if (textNode.type === 'text') {
                        const textRun = new TextRun({
                          text: textNode.text || '',
                          bold: textNode.marks?.some((mark: any) => mark.type === 'bold'),
                          italics: textNode.marks?.some((mark: any) => mark.type === 'italic'),
                          size: 24,
                          font: "Arial",
                        });
                        runs.push(textRun);
                      }
                    }
                  }
                  
                  const listParagraph = new Paragraph({
                    children: runs,
                    alignment: AlignmentType.RIGHT,
                    indent: {
                      right: 720, // إزاحة للقائمة
                    }
                  });
                  
                  paragraphs.push(listParagraph);
                }
              }
            }
          }
        }
      } else if (node.type === 'orderedList') {
        // معالجة القوائم المرقمة
        if (node.content) {
          let counter = 1;
          for (const listItem of node.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const listContent of listItem.content) {
                if (listContent.type === 'paragraph') {
                  const runs: TextRun[] = [new TextRun({ text: `${counter}. ` })];
                  
                  if (listContent.content) {
                    for (const textNode of listContent.content) {
                      if (textNode.type === 'text') {
                        const textRun = new TextRun({
                          text: textNode.text || '',
                          bold: textNode.marks?.some((mark: any) => mark.type === 'bold'),
                          italics: textNode.marks?.some((mark: any) => mark.type === 'italic'),
                          size: 24,
                          font: "Arial",
                        });
                        runs.push(textRun);
                      }
                    }
                  }
                  
                  const listParagraph = new Paragraph({
                    children: runs,
                    alignment: AlignmentType.RIGHT,
                    indent: {
                      right: 720,
                    }
                  });
                  
                  paragraphs.push(listParagraph);
                  counter++;
                }
              }
            }
          }
        }
      }
    }
    
    return paragraphs;
  };

  // مساعدات للتحويل
  const getAlignmentFromAttrs = (attrs: any) => {
    if (!attrs?.textAlign) return AlignmentType.RIGHT;
    
    switch (attrs.textAlign) {
      case 'left': return AlignmentType.LEFT;
      case 'center': return AlignmentType.CENTER;
      case 'right': return AlignmentType.RIGHT;
      case 'justify': return AlignmentType.JUSTIFIED;
      default: return AlignmentType.RIGHT;
    }
  };

  const getHeadingLevel = (level: number) => {
    switch (level) {
      case 1: return HeadingLevel.HEADING_1;
      case 2: return HeadingLevel.HEADING_2;
      case 3: return HeadingLevel.HEADING_3;
      case 4: return HeadingLevel.HEADING_4;
      case 5: return HeadingLevel.HEADING_5;
      case 6: return HeadingLevel.HEADING_6;
      default: return HeadingLevel.HEADING_1;
    }
  };

  const getHeadingSize = (level: number): number => {
    switch (level) {
      case 1: return 32; // 16pt
      case 2: return 28; // 14pt
      case 3: return 26; // 13pt
      case 4: return 24; // 12pt
      case 5: return 22; // 11pt
      case 6: return 20; // 10pt
      default: return 32;
    }
  };

  // تصدير HTML
  const exportToHTML = () => {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Cairo', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            margin: 2cm;
            background: white;
        }
        @media print {
            body { margin: 1cm; }
        }
    </style>
</head>
<body>
    ${editor.getHTML()}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const cleanTitle = title.replace(/[^\w\s-]/g, '').trim();
    saveAs(blob, `${cleanTitle}.html`);
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير المستند كملف HTML",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'جاري التصدير...' : 'تصدير'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 ml-2" />
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToWord} disabled={isExporting}>
          <FileText className="h-4 w-4 ml-2" />
          تصدير Word
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToHTML} disabled={isExporting}>
          <Image className="h-4 w-4 ml-2" />
          تصدير HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportEngine;