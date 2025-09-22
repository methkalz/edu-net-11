import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Typography from '@tiptap/extension-typography';
import { cn } from '@/lib/utils';
import { ProfessionalToolbar } from './ProfessionalToolbar';
import { A4PageSystem } from './A4PageSystem';
import { EnhancedA4PageSystem } from './EnhancedA4PageSystem';
import { PrintPreview } from './PrintPreview';
import { ExportEngine } from './ExportEngine';
import { CollaborationSystem } from './CollaborationSystem';
import { AutoSaveSystem } from './AutoSaveSystem';
import { ViewMode } from './ViewModeToggle';

interface ProfessionalDocumentEditorProps {
  documentId?: string;
  initialContent?: any;
  onContentChange?: (content: any, html: string, plainText: string) => void;
  onSave?: (content: any) => void;
  readOnly?: boolean;
  className?: string;
  showToolbar?: boolean;
  showPageBreaks?: boolean;
  enableCollaboration?: boolean;
  autoSave?: boolean;
  title?: string;
  wordCount?: number;
  enableImagePasting?: boolean;
  enableImageResizing?: boolean;
}

export const ProfessionalDocumentEditor: React.FC<ProfessionalDocumentEditorProps> = ({
  documentId,
  initialContent,
  onContentChange,
  onSave,
  readOnly = false,
  className,
  showToolbar = true,
  showPageBreaks = false,
  enableCollaboration = false,
  autoSave = true,
  title = "مستند جديد",
  wordCount = 0,
  enableImagePasting = true,
  enableImageResizing = true,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [currentWordCount, setCurrentWordCount] = useState(wordCount);
  const [characterCount, setCharacterCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // إضافة معالجة الصور المحسنة
  const ImageExtension = Image.configure({
    HTMLAttributes: {
      class: 'prosemirror-image',
    },
    allowBase64: true,
    inline: false,
  });

  // إضافة extensions محسنة مع دعم الصور
  const extensions = [
    StarterKit.configure({
      document: false,
      paragraph: false,
      heading: false,
      bold: false,
      italic: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
    }),
    Document,
    Paragraph.configure({
      HTMLAttributes: {
        dir: 'rtl',
      },
    }),
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {
        dir: 'rtl',
      },
    }),
    Bold,
    Italic,
    Underline,
    TextStyle,
    Color,
    FontFamily.configure({
      types: ['textStyle'],
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    BulletList.configure({
      HTMLAttributes: {
        dir: 'rtl',
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        dir: 'rtl',
      },
    }),
    ListItem,
    ImageExtension,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Typography.configure({
      openDoubleQuote: '"',
      closeDoubleQuote: '"',
      openSingleQuote: "'",
      closeSingleQuote: "'",
    }),
  ];

  // إعداد المحرر
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !readOnly,
    enableInputRules: true,
    enablePasteRules: true,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      const text = editor.getText();
      
      setCurrentWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
      setCharacterCount(text.length);
      
      onContentChange?.(json, html, text);
      
      // إعداد الحفظ التلقائي
      if (autoSave && !readOnly) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(handleAutoSave, 3000);
      }
    },
    onCreate: ({ editor }) => {
      // تطبيق التوجه العربي والخط الافتراضي
      editor.commands.focus();
      editor.commands.setFontFamily('Cairo, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif');
    },
  });

  // معالجة الحفظ التلقائي
  const handleAutoSave = useCallback(async () => {
    if (!editor || readOnly || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editor.getJSON());
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, readOnly, onSave]);

  // معالجة الحفظ اليدوي
  const handleManualSave = useCallback(async () => {
    if (!editor || readOnly || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editor.getJSON());
      setLastSaved(new Date());
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, readOnly, onSave]);

  // معالجة لصق الصور من الحافظة
  useEffect(() => {
    if (!editor || !enableImagePasting) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          
          if (file) {
            try {
              // تحويل الصورة إلى base64
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                editor.commands.setImage({ 
                  src,
                  alt: 'صورة مُلصقة',
                  title: 'صورة مُلصقة من الحافظة'
                });
              };
              reader.readAsDataURL(file);
            } catch (error) {
              console.error('Error pasting image:', error);
            }
          }
          break;
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('paste', handlePaste);

    return () => {
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, [editor, enableImagePasting]);

  // معالجة تغيير حجم الصور
  useEffect(() => {
    if (!editor || !enableImageResizing) return;

    const handleImageResize = () => {
      const images = editor.view.dom.querySelectorAll('img');
      
      images.forEach((img) => {
        if (img.classList.contains('resize-handled')) return;
        
        img.classList.add('resize-handled');
        img.style.cursor = 'nw-resize';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        let isResizing = false;
        
        img.addEventListener('mousedown', (e) => {
          if (e.target !== img) return;
          isResizing = true;
          e.preventDefault();
          
          const startX = e.clientX;
          const startWidth = img.offsetWidth;
          
          const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            const newWidth = startWidth + (e.clientX - startX);
            const maxWidth = img.parentElement?.offsetWidth || 800;
            const finalWidth = Math.min(Math.max(newWidth, 100), maxWidth);
            
            img.style.width = `${finalWidth}px`;
          };
          
          const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      });
    };

    // تشغيل معالج تغيير الحجم عند التحديث
    const observer = new MutationObserver(handleImageResize);
    observer.observe(editor.view.dom, { childList: true, subtree: true });
    
    // تشغيل المعالج للصور الموجودة
    handleImageResize();

    return () => {
      observer.disconnect();
    };
  }, [editor, enableImageResizing]);

  // معالجة تغيير نمط العرض
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (mode === 'print-preview') {
      setShowPrintPreview(true);
    } else {
      setViewMode(mode);
      setShowPrintPreview(false);
    }
  }, []);

  // معالجة فتح معاينة الطباعة
  const handlePrintPreview = useCallback(() => {
    setShowPrintPreview(true);
  }, []);

  // معالجة إغلاق معاينة الطباعة
  const handleClosePrintPreview = useCallback(() => {
    setShowPrintPreview(false);
  }, []);

  // تحديث معلومات الصفحة كل 2 ثانية
  useEffect(() => {
    if (viewMode !== 'page-breaks') return;
    
    const interval = setInterval(() => {
      if (!editor) return;
      const content = editor.view.dom;
      const contentHeight = content.scrollHeight;
      const pageHeight = 1056; // ارتفاع صفحة Word دقيق
      const pages = Math.ceil(contentHeight / pageHeight);
      setPageCount(pages);
    }, 2000);
    return () => clearInterval(interval);
  }, [editor, viewMode]);

  // تنظيف timeout عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل المحرر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* شريط الأدوات */}
      {showToolbar && (
        <ProfessionalToolbar
          editor={editor}
          title={title}
          wordCount={currentWordCount}
          characterCount={characterCount}
          onSave={handleManualSave}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onPrintPreview={handlePrintPreview}
          isSaving={isSaving}
          lastSaved={lastSaved}
          totalPages={pageCount}
        />
      )}

      {/* منطقة المحرر */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'page-breaks' ? (
          <EnhancedA4PageSystem 
            className="h-full"
            onPageCountChange={setPageCount}
          >
            <EditorContent editor={editor} />
          </EnhancedA4PageSystem>
        ) : (
          <div 
            className={cn(
              "h-full overflow-y-auto",
              "prose prose-lg max-w-none",
              "prose-headings:font-bold prose-headings:text-foreground",
              "prose-p:text-foreground prose-p:leading-relaxed",
              "prose-strong:text-foreground prose-strong:font-semibold",
              "prose-em:text-foreground",
              "prose-ul:text-foreground prose-ol:text-foreground",
              "prose-li:text-foreground prose-li:marker:text-muted-foreground",
              "prose-blockquote:text-muted-foreground prose-blockquote:border-border",
              "prose-code:text-foreground prose-code:bg-muted",
              "prose-pre:bg-muted prose-pre:text-foreground",
              "prose-hr:border-border",
              "prose-table:text-foreground",
              "prose-th:border-border prose-td:border-border",
              "[&_.prosemirror-image]:max-w-full [&_.prosemirror-image]:h-auto [&_.prosemirror-image]:cursor-nw-resize",
              "[&_.prosemirror-image]:border-2 [&_.prosemirror-image]:border-transparent",
              "[&_.prosemirror-image:hover]:border-primary/50",
              "[&_.prosemirror-image]:transition-all [&_.prosemirror-image]:duration-200",
              "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
              "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[calc(100vh-200px)]",
              "[&_.ProseMirror]:p-8",
              "[&_.ProseMirror]:leading-7",
              "[&_.ProseMirror]:font-[Cairo]",
              "[&_.ProseMirror]:text-base",
              "[&_.ProseMirror]:dir-rtl"
            )}
          >
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {/* شريط الحالة */}
      <div className="flex-shrink-0 border-t bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>الكلمات: {currentWordCount}</span>
            <span>الأحرف: {characterCount}</span>
            {viewMode === 'page-breaks' && <span>الصفحات: {pageCount}</span>}
            <span className="text-primary">النمط: {
              viewMode === 'continuous' ? 'تحرير مستمر' :
              viewMode === 'page-breaks' ? 'معاينة صفحات' : 'معاينة طباعة'
            }</span>
            {enableImagePasting && (
              <span className="text-primary">اضغط Ctrl+V للصق الصور</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-primary">جاري الحفظ...</span>}
            {lastSaved && (
              <span>آخر حفظ: {lastSaved.toLocaleTimeString('ar')}</span>
            )}
          </div>
        </div>
      </div>

      {/* أنظمة إضافية */}
      {enableCollaboration && documentId && (
        <CollaborationSystem documentId={documentId} editor={editor} />
      )}
      
      {autoSave && documentId && onSave && (
        <AutoSaveSystem
          documentId={documentId}
          editor={editor}
          content={editor.getJSON()}
          onSave={onSave}
          enabled={!readOnly}
        />
      )}
      
      <ExportEngine editor={editor} title={title} />

      {/* معاينة الطباعة */}
      <PrintPreview
        editor={editor}
        title={title}
        isOpen={showPrintPreview}
        onClose={handleClosePrintPreview}
      />
    </div>
  );
};

// أنماط CSS إضافية للمحرر
const styles = `
  .prosemirror-image {
    display: block;
    margin: 1rem auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .prosemirror-image:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  .prosemirror-image.ProseMirror-selectednode {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }

  @media print {
    .prosemirror-image {
      max-width: 100% !important;
      height: auto !important;
      page-break-inside: avoid;
    }
  }
`;

// إدراج الأنماط في الصفحة
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}