import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
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
  Image,
  Table,
  Save,
  Download,
  Share2,
  Undo,
  Redo,
  Type,
  Palette,
  FileText,
  Eye,
  Users,
  Settings,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ViewModeToggle, ViewMode } from './ViewModeToggle';

interface ProfessionalToolbarProps {
  editor: Editor;
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  documentId?: string;
  title?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onPrintPreview?: () => void;
  wordCount?: number;
  characterCount?: number;
  currentPage?: number;
  totalPages?: number;
}

export const ProfessionalToolbar: React.FC<ProfessionalToolbarProps> = ({
  editor,
  onSave,
  isSaving = false,
  lastSaved,
  documentId,
  title = "مستند جديد",
  viewMode = 'continuous',
  onViewModeChange,
  onPrintPreview,
  wordCount = 0,
  characterCount = 0,
  currentPage = 1,
  totalPages = 1
}) => {
  const [activeColorPicker, setActiveColorPicker] = useState<'text' | 'highlight' | null>(null);
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('Cairo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // قائمة الخطوط العربية
  const arabicFonts = [
    { value: 'Cairo', label: 'القاهرة' },
    { value: 'Amiri', label: 'أميري' },
    { value: 'Noto Sans Arabic', label: 'نوتو سانس عربي' },
    { value: 'Tajawal', label: 'تجوال' },
    { value: 'Almarai', label: 'المرعى' },
    { value: 'Markazi Text', label: 'نص مركزي' },
    { value: 'Scheherazade', label: 'شهرزاد' },
  ];

  // قائمة أحجام الخط
  const fontSizes = [
    '8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'
  ];

  // ألوان النص الشائعة
  const textColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#FF6600', '#FFCC00', '#00FF00',
    '#0066CC', '#9900CC', '#FF0099', '#00CCFF'
  ];

  // وظائف التنسيق
  const toggleBold = useCallback(() => {
    editor.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);

  const setTextAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.chain().focus().setTextAlign(alignment).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const setHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6 | 0) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    editor.chain().focus().setColor(color).run();
    setActiveColorPicker(null);
  }, [editor]);

  const setFontFamilyHandler = useCallback((family: string) => {
    editor.chain().focus().setFontFamily(family).run();
    setFontFamily(family);
  }, [editor]);

  const setFontSizeHandler = useCallback((size: string) => {
    editor.chain().focus().setFontSize(`${size}px`).run();
    setFontSize(size);
  }, [editor]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImageSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleUndo = useCallback(() => {
    editor.chain().focus().undo().run();
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.chain().focus().redo().run();
  }, [editor]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share && documentId) {
      navigator.share({
        title: title,
        text: `مشاركة مستند: ${title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط المستند إلى الحافظة",
      });
    }
  }, [documentId, title, toast]);

  return (
    <div className="professional-toolbar border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* الصف الأول - العنوان والحفظ */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
            {title}
          </h1>
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              آخر حفظ: {lastSaved.toLocaleTimeString('ar')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* إحصائيات سريعة */}
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span>الكلمات: {wordCount.toLocaleString('ar')}</span>
            <span>الصفحات: {totalPages.toLocaleString('ar')}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* أزرار الحفظ والمشاركة */}
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1"
          >
            <Share2 className="h-4 w-4" />
            مشاركة
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onPrintPreview}
            className="gap-1"
          >
            <Printer className="h-4 w-4" />
            معاينة طباعة
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* تبديل أنماط العرض */}
          <ViewModeToggle
            currentMode={viewMode}
            onModeChange={onViewModeChange || (() => {})}
          />
        </div>
      </div>

      {/* الصف الثاني - أدوات التنسيق */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
        {/* تراجع وإعادة */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!editor.can().undo()}
            className="p-2"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!editor.can().redo()}
            className="p-2"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* نوع النص */}
        <Select value="0" onValueChange={(value) => setHeading(parseInt(value) as any)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="نوع النص" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">فقرة عادية</SelectItem>
            <SelectItem value="1">عنوان 1</SelectItem>
            <SelectItem value="2">عنوان 2</SelectItem>
            <SelectItem value="3">عنوان 3</SelectItem>
            <SelectItem value="4">عنوان 4</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* الخط */}
        <Select value={fontFamily} onValueChange={setFontFamilyHandler}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {arabicFonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* حجم الخط */}
        <Select value={fontSize} onValueChange={setFontSizeHandler}>
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* تنسيق النص */}
        <div className="flex items-center gap-1">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBold}
            className="p-2"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleItalic}
            className="p-2"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleUnderline}
            className="p-2"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* لون النص */}
        <Popover
          open={activeColorPicker === 'text'}
          onOpenChange={(open) => setActiveColorPicker(open ? 'text' : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="grid grid-cols-4 gap-1">
              {textColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* محاذاة النص */}
        <div className="flex items-center gap-1">
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('right')}
            className="p-2"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('center')}
            className="p-2"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('left')}
            className="p-2"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('justify')}
            className="p-2"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* القوائم */}
        <div className="flex items-center gap-1">
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBulletList}
            className="p-2"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleOrderedList}
            className="p-2"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* إدراج */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImageUpload}
            className="p-2"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertTable}
            className="p-2"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Input مخفي لرفع الصور */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageSelected}
        className="hidden"
      />

      <style>{`
        .professional-toolbar {
          font-family: 'Cairo', 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
          direction: rtl;
        }
        
        .professional-toolbar .flex {
          direction: ltr;
        }
        
        .professional-toolbar button {
          direction: rtl;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalToolbar;