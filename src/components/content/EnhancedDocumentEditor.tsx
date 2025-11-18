import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Palette,
  Download,
  Upload,
  Image as ImageIcon,
  Table,
  FileText,
  Search,
  Replace,
  Save,
  Printer,
  Undo,
  Redo,
  Indent,
  Outdent,
  Subscript,
  Superscript,
  Link,
  Quote,
  Code,
  Strikethrough,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageResizer from './ImageResizer';

interface EnhancedDocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autoSave?: boolean;
  onSave?: () => void;
  readOnly?: boolean;
  toolbarOnly?: boolean;
  targetElementId?: string;
}

interface FindReplaceState {
  isOpen: boolean;
  findText: string;
  replaceText: string;
  caseSensitive: boolean;
  wholeWord: boolean;
}

const EnhancedDocumentEditor: React.FC<EnhancedDocumentEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = "ابدأ الكتابة هنا...",
  autoSave = false,
  onSave,
  readOnly = false,
  toolbarOnly = false,
  targetElementId = "main-editor"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: '3',
    fontFamily: 'Arial',
    textAlign: 'right',
    textColor: '#000000',
    backgroundColor: '#ffffff'
  });

  const [findReplace, setFindReplace] = useState<FindReplaceState>({
    isOpen: false,
    findText: '',
    replaceText: '',
    caseSensitive: false,
    wholeWord: false
  });

  const [wordCount, setWordCount] = useState({ words: 0, chars: 0, charsNoSpaces: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [isA4Mode, setIsA4Mode] = useState(true);

  // Color palettes
  const textColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
    '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#0066FF',
    '#6600FF', '#FF0066', '#0099FF', '#00CC66', '#FF9900'
  ];

  const highlightColors = [
    '#FFFF00', '#00FFFF', '#FF00FF', '#00FF00', '#FFA500',
    '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C'
  ];

  // Calculate statistics
  const updateStatistics = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;
      
      setWordCount({ words, chars, charsNoSpaces });
      
      // Estimate page count (assuming ~250 words per page)
      const estimatedPages = Math.max(1, Math.ceil(words / 250));
      setPageCount(estimatedPages);
    }
  }, []);

  // تحديث المحتوى الأولي فقط عند التحميل الأول
  useEffect(() => {
    if (editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
      updateStatistics();
    }
  }, []);

  // تحديث الإحصائيات عند تغيير المحتوى
  useEffect(() => {
    updateStatistics();
  }, [content, updateStatistics]);

  const formatDocument = (command: string, value?: string) => {
    if (readOnly) return;
    
    if (toolbarOnly) {
      const targetElement = document.getElementById(targetElementId);
      if (targetElement) {
        targetElement.focus();
        document.execCommand(command, false, value);
        const newContent = targetElement.innerHTML;
        onChange(newContent);
      }
    } else {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      updateContent();
    }
  };

  const updateContent = () => {
    if (editorRef.current && !readOnly) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
      updateStatistics();
    }
  };

  // Enhanced image handling with drag & drop
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 10 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const imageHTML = `
        <div class="image-container" style="margin: 20px auto; text-align: center; display: inline-block; position: relative; max-width: 100%;">
          <img 
            id="${imageId}"
            src="${e.target?.result}" 
            style="
              max-width: 100%; 
              height: auto; 
              border-radius: 8px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
              cursor: default;
              resize: both;
              overflow: auto;
              display: block;
            " 
            alt="صورة"
            onload="this.style.width = Math.min(this.naturalWidth, 600) + 'px';"
            draggable="false"
          />
          <div class="image-resize-handles" style="
            position: absolute;
            bottom: 5px;
            right: 5px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            user-select: none;
          " onclick="toggleImageSize('${imageId}')">⟷</div>
        </div>
        <script>
          function toggleImageSize(imgId) {
            const img = document.getElementById(imgId);
            if (!img) return;
            
            const currentWidth = img.style.width || img.offsetWidth + 'px';
            const naturalWidth = img.naturalWidth;
            const containerWidth = img.closest('.image-container').offsetWidth;
            
            if (parseInt(currentWidth) < naturalWidth * 0.8) {
              img.style.width = Math.min(naturalWidth, containerWidth) + 'px';
            } else if (parseInt(currentWidth) > naturalWidth * 0.5) {
              img.style.width = (naturalWidth * 0.3) + 'px';
            } else {
              img.style.width = (naturalWidth * 0.6) + 'px';
            }
          }
        </script>
      `;
      document.execCommand('insertHTML', false, imageHTML);
      updateContent();
    };
    reader.readAsDataURL(file);
  };

  // Enhanced paste handling
  const handlePaste = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        return;
      }
    }

    // Handle rich text paste
    const htmlData = e.clipboardData?.getData('text/html');
    if (htmlData) {
      e.preventDefault();
      
      // Clean and sanitize HTML
      const cleanHTML = htmlData
        .replace(/<o:p\s*\/?>|<\/o:p>/gi, '') // Remove Office tags
        .replace(/<span[^>]*>(\s*)<\/span>/gi, '$1') // Remove empty spans
        .replace(/style="[^"]*"/gi, '') // Remove inline styles for now
        .replace(/<font[^>]*>/gi, '<span>') // Convert font tags
        .replace(/<\/font>/gi, '</span>');
      
      document.execCommand('insertHTML', false, cleanHTML);
      updateContent();
    }
  };

  // Drag and drop handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (readOnly) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    });
  };

  // Enhanced table insertion
  const insertAdvancedTable = () => {
    const rows = prompt('عدد الصفوف:') || '3';
    const cols = prompt('عدد الأعمدة:') || '3';
    const hasHeader = confirm('هل تريد صف رأس للجدول؟');
    
    let tableHTML = `
      <table style="
        border-collapse: collapse; 
        width: 100%; 
        margin: 20px 0; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      ">
    `;
    
    for (let i = 0; i < parseInt(rows); i++) {
      const isHeaderRow = hasHeader && i === 0;
      tableHTML += '<tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        const cellTag = isHeaderRow ? 'th' : 'td';
        const cellStyle = isHeaderRow 
          ? 'padding: 12px; border: 1px solid #ddd; background-color: #f8f9fa; font-weight: bold; text-align: center;'
          : 'padding: 12px; border: 1px solid #ddd; text-align: right;';
        
        tableHTML += `<${cellTag} style="${cellStyle}">${isHeaderRow ? `عمود ${j + 1}` : '&nbsp;'}</${cellTag}>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    document.execCommand('insertHTML', false, tableHTML);
    updateContent();
  };

  // Find and replace functionality
  const findText = () => {
    if (!findReplace.findText || !editorRef.current) return;
    
    const searchText = findReplace.findText;
    const content = editorRef.current.innerHTML;
    
    // Use Selection API for better browser compatibility
    if (window.getSelection && document.createRange) {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Simple text search implementation
      if (content.toLowerCase().includes(searchText.toLowerCase())) {
        toast({
          title: "تم العثور على النص",
          description: `تم العثور على "${searchText}"`
        });
      } else {
        toast({
          title: "لم يتم العثور على النص",
          description: `لم يتم العثور على "${searchText}"`
        });
      }
    }
  };

  const replaceAll = () => {
    if (!findReplace.findText || !editorRef.current) return;
    
    let content = editorRef.current.innerHTML;
    const flags = findReplace.caseSensitive ? 'g' : 'gi';
    const searchPattern = findReplace.wholeWord 
      ? new RegExp(`\\b${findReplace.findText}\\b`, flags)
      : new RegExp(findReplace.findText, flags);
    
    const newContent = content.replace(searchPattern, findReplace.replaceText);
    editorRef.current.innerHTML = newContent;
    updateContent();
    
    toast({
      title: "تم الاستبدال",
      description: "تم استبدال جميع النصوص المطابقة"
    });
  };

  // Export functions
  const exportToPDF = () => {
    window.print();
  };

  const exportToWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>مستند</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            direction: rtl; 
            margin: 2cm;
          }
          @page { size: A4; margin: 2cm; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #000; padding: 8px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Insert special elements
  const insertHorizontalRule = () => {
    const hrHTML = '<hr style="margin: 20px 0; border: none; border-top: 2px solid #ddd;" />';
    document.execCommand('insertHTML', false, hrHTML);
    updateContent();
  };

  const insertPageBreak = () => {
    const pageBreakHTML = '<div style="page-break-before: always;"></div>';
    document.execCommand('insertHTML', false, pageBreakHTML);
    updateContent();
  };

  const insertDateTime = () => {
    const now = new Date();
    const dateTime = now.toLocaleString('ar-EG');
    document.execCommand('insertText', false, dateTime);
    updateContent();
  };

  return (
    <>
      <ImageResizer />
      <div className="border rounded-lg overflow-hidden bg-white shadow-lg h-full flex flex-col">
        {/* Enhanced Toolbar */}
        <div className="bg-muted/30 p-3 border-b shrink-0">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {!readOnly && (
            <>
              {/* File Operations */}
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={onSave} className="gap-1">
                  <Save className="h-4 w-4" />
                  حفظ
                </Button>
                <Button variant="ghost" size="sm" onClick={exportToPDF} className="gap-1">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Undo/Redo */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatDocument('undo')}
                  className="p-2"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatDocument('redo')}
                  className="p-2"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Basic Formatting */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatDocument('strikeThrough')}
                  className="p-2"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Font and Size */}
              <div className="flex gap-2">
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
                    <SelectItem value="Tahoma">Tahoma</SelectItem>
                    <SelectItem value="Cairo">Cairo</SelectItem>
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

              <Separator orientation="vertical" className="h-6" />

              {/* Text Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Palette className="h-4 w-4" />
                    ألوان
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">لون النص</Label>
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {textColors.map(color => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => formatDocument('foreColor', color)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">لون التمييز</Label>
                      <div className="grid grid-cols-5 gap-1 mt-2">
                        {highlightColors.map(color => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => formatDocument('backColor', color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className="h-6" />

              {/* Alignment */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatDocument('justifyFull')}
                  className="p-2"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Lists and Indentation */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatDocument('indent')}
                  className="p-2"
                >
                  <Indent className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatDocument('outdent')}
                  className="p-2"
                >
                  <Outdent className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Insert Elements */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertAdvancedTable}
                  className="gap-1 text-xs"
                >
                  <Table className="h-4 w-4" />
                  جدول
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1 text-xs"
                >
                  <ImageIcon className="h-4 w-4" />
                  صورة
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertHorizontalRule}
                  className="text-xs"
                >
                  خط فاصل
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Tools */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFindReplace(prev => ({ ...prev, isOpen: true }))}
                  className="gap-1 text-xs"
                >
                  <Search className="h-4 w-4" />
                  بحث
                </Button>
              </div>

              <div className="mr-auto flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToWord}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  Word
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  className="gap-1"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
        className="hidden"
      />

      {/* Main Editor Content - Only show if not toolbar-only mode */}
      {!toolbarOnly && (
        <>
          <div 
            className={`${isA4Mode ? 'max-w-4xl mx-auto bg-white shadow-lg overflow-y-auto max-h-screen' : 'overflow-y-auto max-h-[70vh]'}`}
            style={isA4Mode ? { 
              minHeight: '29.7cm',
              scrollBehavior: 'smooth'
            } : {
              scrollBehavior: 'smooth'
            }}
          >
            <div
              ref={editorRef}
              contentEditable={!readOnly}
              dir="auto"
              className={`outline-none document-editor ${isA4Mode ? 'p-16' : 'p-6'} min-h-[500px] focus:outline-none focus:ring-2 focus:ring-primary/20`}
              style={{ 
                lineHeight: '1.8',
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                scrollbarWidth: 'auto',
                scrollbarColor: '#cbd5e1 #f1f5f9',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                ...(isA4Mode && { 
                  width: '21cm',
                  minHeight: '29.7cm',
                  margin: '0 auto',
                  padding: '2cm',
                  backgroundColor: 'white',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                })
              }}
              onInput={updateContent}
              onBlur={updateContent}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              suppressContentEditableWarning={true}
              data-placeholder={placeholder}
            >
              {!content && (
                <p className="text-muted-foreground">{placeholder}</p>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-muted/30 px-4 py-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <span>الكلمات: {wordCount.words}</span>
                <span>الأحرف: {wordCount.chars}</span>
                <span>الأحرف (بدون مسافات): {wordCount.charsNoSpaces}</span>
                <span>الصفحات: {pageCount}</span>
              </div>
              
              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsA4Mode(!isA4Mode)}
                  className="text-xs"
                >
                  {isA4Mode ? 'عرض عادي' : 'عرض A4'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Find & Replace Dialog */}
      <Dialog open={findReplace.isOpen} onOpenChange={(open) => setFindReplace(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>البحث والاستبدال</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="findText">البحث عن:</Label>
              <Input
                id="findText"
                value={findReplace.findText}
                onChange={(e) => setFindReplace(prev => ({ ...prev, findText: e.target.value }))}
                placeholder="النص المراد البحث عنه"
              />
            </div>
            <div>
              <Label htmlFor="replaceText">الاستبدال بـ:</Label>
              <Input
                id="replaceText"
                value={findReplace.replaceText}
                onChange={(e) => setFindReplace(prev => ({ ...prev, replaceText: e.target.value }))}
                placeholder="النص البديل"
              />
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={findReplace.caseSensitive}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                />
                حساس لحالة الأحرف
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={findReplace.wholeWord}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, wholeWord: e.target.checked }))}
                />
                كلمة كاملة فقط
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={findText} variant="outline" className="flex-1">
                البحث التالي
              </Button>
              <Button onClick={replaceAll} className="flex-1">
                استبدال الجميع
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              size: A4;
              margin: 2cm;
            }
           }
         `
       }} />
     </div>
    </>
  );
};

export default EnhancedDocumentEditor;