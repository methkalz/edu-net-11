import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { supabase } from '@/integrations/supabase/client';
import { wrapHTMLContentForIframe } from '@/lib/html-embed-utils';
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
  Printer,
  Presentation,
  Code
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [showGammaDialog, setShowGammaDialog] = useState(false);
  const [gammaUrl, setGammaUrl] = useState('');
  const [gammaTitle, setGammaTitle] = useState('');
  const [gammaUrlError, setGammaUrlError] = useState('');
  const [showHTMLDialog, setShowHTMLDialog] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [htmlTitle, setHtmlTitle] = useState('محتوى HTML تفاعلي');
  const [htmlHeight, setHtmlHeight] = useState('400px');
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

  // Gamma presentation validation and insert
  const validateGammaUrl = (url: string): boolean => {
    const pattern = /^https:\/\/gamma\.app\/embed\/[a-zA-Z0-9]+$/;
    return pattern.test(url.trim());
  };

  const handleGammaInsert = useCallback(() => {
    setGammaUrlError('');
    
    if (!gammaUrl.trim()) {
      setGammaUrlError('الرجاء إدخال رابط العرض التقديمي');
      return;
    }

    if (!validateGammaUrl(gammaUrl)) {
      setGammaUrlError('رابط غير صحيح. يجب أن يبدأ بـ https://gamma.app/embed/');
      return;
    }

    editor.commands.setGammaEmbed({
      src: gammaUrl.trim(),
      title: gammaTitle.trim() || 'عرض تقديمي من Gamma',
      width: '100%',
      height: '450px',
    });

    // Reset and close
    setGammaUrl('');
    setGammaTitle('');
    setShowGammaDialog(false);
    
    toast({
      title: "تم إضافة العرض التقديمي",
      description: "تم إدراج العرض التقديمي بنجاح",
    });
  }, [editor, gammaUrl, gammaTitle, toast]);

  // HTML validation and insert
  const validateHTMLCode = async (code: string): Promise<{ isValid: boolean; error?: string }> => {
    if (!code.trim()) {
      return { isValid: false, error: 'الكود فارغ' };
    }

    if (code.toLowerCase().includes('<iframe')) {
      return { isValid: false, error: 'لا يُسمح بتضمين iframes داخل الكود' };
    }

    // التحقق من external scripts
    const scriptSrcRegex = /<script[^>]*\ssrc\s*=/i;
    if (scriptSrcRegex.test(code)) {
      // جلب CDNs الموثوقة
      const { data: trustedCDNs, error: fetchError } = await supabase
        .from('trusted_cdn_domains')
        .select('domain')
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching trusted CDNs:', fetchError);
        return { isValid: false, error: 'خطأ في التحقق من CDNs الموثوقة' };
      }

      // استخراج جميع script src URLs
      const scriptMatches = code.match(/<script[^>]+src=["']([^"']+)["']/gi);
      if (scriptMatches) {
        for (const match of scriptMatches) {
          const urlMatch = match.match(/src=["']([^"']+)["']/i);
          if (urlMatch && urlMatch[1]) {
            const url = urlMatch[1];
            
            // التحقق من HTTPS
            if (!url.startsWith('https://')) {
              return { isValid: false, error: 'يجب أن تكون جميع scripts عبر HTTPS فقط' };
            }

            // استخراج النطاق
            let domain: string;
            try {
              domain = new URL(url).hostname;
            } catch (e) {
              return { isValid: false, error: 'رابط script غير صحيح' };
            }

            // التحقق من وجود النطاق في القائمة الموثوقة
            const isTrusted = trustedCDNs?.some(cdn => domain === cdn.domain || domain.endsWith('.' + cdn.domain));
            if (!isTrusted) {
              return { 
                isValid: false, 
                error: `النطاق ${domain} غير موثوق. يمكن للسوبر آدمن إضافته في صفحة إدارة CDNs` 
              };
            }
          }
        }
      }
    }

    return { isValid: true };
  };

  const handleHTMLInsert = useCallback(async () => {
    const validation = await validateHTMLCode(htmlCode);
    
    if (!validation.isValid) {
      toast({
        title: "خطأ في التحقق",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    editor.commands.setHTMLEmbed({
      htmlContent: htmlCode.trim(),
      title: htmlTitle || 'محتوى HTML تفاعلي',
      height: htmlHeight,
    });

    // Reset and close
    setHtmlCode('');
    setHtmlTitle('محتوى HTML تفاعلي');
    setHtmlHeight('400px');
    setShowHTMLDialog(false);
    
    toast({
      title: "تم إضافة المحتوى",
      description: "تم إدراج محتوى HTML بنجاح",
    });
  }, [editor, htmlCode, htmlTitle, htmlHeight, toast]);

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
            title="إدراج صورة"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertTable}
            className="p-2"
            title="إدراج جدول"
          >
            <Table className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGammaDialog(true)}
            className="p-2"
            title="إدراج عرض تقديمي من Gamma"
          >
            <Presentation className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHTMLDialog(true)}
            className="p-2"
            title="إدراج كود HTML تفاعلي"
          >
            <Code className="h-4 w-4" />
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

      {/* Gamma Dialog */}
      <Dialog open={showGammaDialog} onOpenChange={setShowGammaDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدراج عرض تقديمي من Gamma</DialogTitle>
            <DialogDescription>
              انسخ رابط التضمين من Gamma والصقه هنا. يجب أن يبدأ الرابط بـ{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">https://gamma.app/embed/</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gamma-url">رابط التضمين *</Label>
              <Input
                id="gamma-url"
                value={gammaUrl}
                onChange={(e) => {
                  setGammaUrl(e.target.value);
                  setGammaUrlError('');
                }}
                placeholder="https://gamma.app/embed/..."
                className={gammaUrlError ? 'border-destructive' : ''}
              />
              {gammaUrlError && (
                <p className="text-sm text-destructive">{gammaUrlError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gamma-title">العنوان (اختياري)</Label>
              <Input
                id="gamma-title"
                value={gammaTitle}
                onChange={(e) => setGammaTitle(e.target.value)}
                placeholder="عنوان العرض التقديمي"
              />
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">كيفية الحصول على رابط التضمين:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>افتح العرض التقديمي في Gamma</li>
                <li>اضغط على زر المشاركة (Share)</li>
                <li>اختر "Embed" أو "التضمين"</li>
                <li>انسخ الرابط من src="..." في كود الـ iframe</li>
              </ol>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowGammaDialog(false);
                setGammaUrl('');
                setGammaTitle('');
                setGammaUrlError('');
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleGammaInsert}>
              إدراج العرض التقديمي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog لإدراج كود HTML تفاعلي */}
      <Dialog open={showHTMLDialog} onOpenChange={setShowHTMLDialog}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>إدراج كود HTML تفاعلي</DialogTitle>
          </DialogHeader>
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden h-[calc(90vh-180px)]">
            <div className="flex flex-col gap-3">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">ملاحظة أمنية</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  يُسمح فقط بتحميل scripts من CDNs موثوقة عبر HTTPS. 
                  يمكن للسوبر آدمن إدارة القائمة من لوحة التحكم.
                </p>
              </div>
              <div>
                <Label htmlFor="html-title">العنوان</Label>
                <Input
                  id="html-title"
                  value={htmlTitle}
                  onChange={(e) => setHtmlTitle(e.target.value)}
                  placeholder="عنوان المحتوى"
                  className="mt-1"
                />
              </div>
                <div>
                  <Label htmlFor="html-height">الارتفاع (مثال: 400px، 50vh، 600px)</Label>
                  <Input
                    id="html-height"
                    value={htmlHeight}
                    onChange={(e) => setHtmlHeight(e.target.value)}
                    placeholder="400px"
                    className="mt-1"
                  />
                </div>
              <div className="flex-1 flex flex-col min-h-0">
                <Label htmlFor="html-code">كود HTML</Label>
                <textarea
                  id="html-code"
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="flex-1 mt-1 p-3 border border-border rounded-md font-mono text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل كود HTML هنا..."
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>معاينة مباشرة</Label>
              <div className="flex-1 border border-border rounded-md overflow-hidden bg-background">
                <iframe
                  srcDoc={wrapHTMLContentForIframe(htmlCode)}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  className="w-full h-full border-0"
                  title="معاينة مباشرة"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowHTMLDialog(false);
                setHtmlCode('');
                setHtmlTitle('محتوى HTML تفاعلي');
                setHtmlHeight('400px');
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleHTMLInsert}>
              إدراج المحتوى
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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