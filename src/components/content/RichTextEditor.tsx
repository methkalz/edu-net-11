import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { FontFamily } from '@tiptap/extension-font-family';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import './table-styles.css';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List,
  ListOrdered,
  Undo,
  Redo,
  Palette,
  Type,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  Merge,
  Split,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  ImagePlus,
  Percent,
  Presentation,
  Code
} from 'lucide-react';
import { GammaEmbed } from '../editor/extensions/GammaEmbed';
import { HTMLEmbed } from '../editor/extensions/HTMLEmbed';
import ImageBubbleMenu from './ImageBubbleMenu';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// Extension مخصص لحجم الخط
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const [customColor, setCustomColor] = useState('#000000');
  const [fontSize, setFontSize] = useState('14px');
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showGammaDialog, setShowGammaDialog] = useState(false);
  const [gammaUrl, setGammaUrl] = useState('');
  const [gammaTitle, setGammaTitle] = useState('');
  const [gammaUrlError, setGammaUrlError] = useState('');
  const [showHTMLDialog, setShowHTMLDialog] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [htmlTitle, setHtmlTitle] = useState('محتوى HTML تفاعلي');
  const [htmlHeight, setHtmlHeight] = useState('400px');
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'min-h-[1.5em]',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pr-6 my-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pr-6 my-2',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'my-1',
          },
        },
      }),
      TableKit.configure({
        table: {
          resizable: true,
          handleWidth: 5,
          cellMinWidth: 50,
          lastColumnResizable: true,
          allowTableNodeSelection: true,
          HTMLAttributes: {
            class: 'border-collapse table-auto w-full my-4',
          },
        },
        tableRow: {
          HTMLAttributes: {
            class: 'border',
          },
        },
        tableHeader: {
          HTMLAttributes: {
            class: 'border border-border bg-muted font-bold p-2 text-right',
          },
        },
        tableCell: {
          HTMLAttributes: {
            class: 'border border-border p-2',
          },
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'right',
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => element.getAttribute('width') || element.style.width,
              renderHTML: attributes => {
                if (!attributes.width) return {};
                return { width: attributes.width, style: `width: ${attributes.width}` };
              },
            },
            height: {
              default: null,
              parseHTML: element => element.getAttribute('height') || element.style.height,
              renderHTML: attributes => {
                if (!attributes.height) return {};
                return { height: attributes.height, style: `height: ${attributes.height}` };
              },
            },
          };
        },
      }).configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-md max-w-full h-auto cursor-pointer hover:shadow-lg transition-shadow my-2',
        },
      }),
      FontSize,
      FontFamily,
      Color,
      Underline,
      GammaEmbed.configure({
        inline: false,
        HTMLAttributes: {},
      }),
      HTMLEmbed.configure({
        inline: false,
        HTMLAttributes: {},
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] focus:outline-none p-4 border rounded-md [&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6 [&_li]:my-1 [&_img]:rounded-md [&_img]:max-w-full [&_img]:h-auto [&_img]:my-2',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.indexOf('image') === 0);

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            handleImageUpload({ target: { files: [file] } } as any);
          }
          return true;
        }
        return false;
      },
    },
  });

  // تحديث المحرر عندما يتغير المحتوى من الخارج
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
      title={title}
    >
      {children}
    </Button>
  );

  const fontSizes = [
    { label: '8', value: '8px' },
    { label: '10', value: '10px' },
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '20', value: '20px' },
    { label: '24', value: '24px' },
    { label: '28', value: '28px' },
    { label: '32', value: '32px' },
    { label: '36', value: '36px' },
  ];

  const quickColors = [
    { name: 'أسود', value: '#000000' },
    { name: 'أحمر', value: '#dc2626' },
    { name: 'أزرق', value: '#2563eb' },
    { name: 'أخضر', value: '#16a34a' },
    { name: 'برتقالي', value: '#ea580c' },
    { name: 'بنفسجي', value: '#9333ea' },
    { name: 'أصفر', value: '#eab308' },
    { name: 'وردي', value: '#ec4899' },
  ];

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    if (value === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
    }
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    editor.chain().focus().setColor(color).run();
  };

  const handleInsertTable = () => {
    const rows = Math.max(1, Math.min(20, tableRows));
    const cols = Math.max(1, Math.min(10, tableCols));
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
    setShowTableDialog(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        editor.chain().focus().setImage({ src: base64 }).run();
        toast.success('تم إضافة الصورة بنجاح');
      }
      setUploadingImage(false);
    };

    reader.onerror = () => {
      toast.error('حدث خطأ في رفع الصورة');
      setUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleImageResize = (width: string) => {
    if (!editor) return;
    
    editor.chain().focus().updateAttributes('image', {
      width: width,
      height: 'auto',
    }).run();
    
    toast.success('تم تغيير حجم الصورة');
  };

  const handleCustomImageResize = (width: string, height: string, unit: '%' | 'px') => {
    if (!editor) return;
    
    const widthValue = `${width}${unit}`;
    const heightValue = height ? `${height}px` : 'auto';
    
    editor.chain().focus().updateAttributes('image', {
      width: widthValue,
      height: heightValue,
    }).run();
    
    toast.success('تم تغيير حجم الصورة');
  };

  const handleResetImageSize = () => {
    if (!editor) return;
    
    editor.chain().focus().updateAttributes('image', {
      width: null,
      height: null,
    }).run();
    
    toast.success('تم إعادة الصورة للحجم الأصلي');
  };

  const handleImageAlignment = (alignment: 'left' | 'center' | 'right') => {
    const img = editor.view.dom.querySelector('.ProseMirror-selectednode') as HTMLImageElement;
    if (img) {
      // تطبيق display block لجعل المحاذاة تعمل
      img.style.display = 'block';
      
      // تطبيق المحاذاة باستخدام margin
      switch (alignment) {
        case 'right':
          img.style.marginLeft = '0';
          img.style.marginRight = 'auto';
          break;
        case 'center':
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          break;
        case 'left':
          img.style.marginLeft = 'auto';
          img.style.marginRight = '0';
          break;
      }
      
      img.setAttribute('data-alignment', alignment);
      toast.success('تم تغيير محاذاة الصورة');
    }
  };

  const handleDeleteImage = () => {
    editor.chain().focus().deleteSelection().run();
    toast.success('تم حذف الصورة');
  };

  const validateGammaUrl = (url: string): boolean => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setGammaUrlError('يرجى إدخال رابط العرض التقديمي');
      return false;
    }
    if (!trimmedUrl.startsWith('https://gamma.app/embed/')) {
      setGammaUrlError('يجب أن يبدأ الرابط بـ https://gamma.app/embed/');
      return false;
    }
    setGammaUrlError('');
    return true;
  };

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

  const handleHTMLInsert = async () => {
    const validation = await validateHTMLCode(htmlCode);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'خطأ في التحقق من الكود');
      return;
    }

    editor.commands.setHTMLEmbed({
      htmlContent: htmlCode.trim(),
      title: htmlTitle || 'محتوى HTML تفاعلي',
      height: htmlHeight,
    });

    toast.success('تم إضافة محتوى HTML بنجاح');
    setShowHTMLDialog(false);
    setHtmlCode('');
    setHtmlTitle('محتوى HTML تفاعلي');
    setHtmlHeight('400px');
  };

  const handleGammaInsert = () => {
    if (!validateGammaUrl(gammaUrl)) {
      return;
    }

    editor.commands.setGammaEmbed({
      src: gammaUrl.trim(),
      title: gammaTitle || 'عرض تقديمي من Gamma',
      width: '100%',
      height: '450px',
    });

    toast.success('تم إضافة العرض التقديمي بنجاح');
    setShowGammaDialog(false);
    setGammaUrl('');
    setGammaTitle('');
    setGammaUrlError('');
  };

  return (
    <div className="border rounded-md bg-background">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* التراجع والإعادة */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="تراجع"
        >
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="إعادة"
        >
          <Redo className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* حجم الخط */}
        <div className="flex items-center gap-1">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="h-8 w-[80px] bg-background">
              <SelectValue placeholder="الحجم" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="default">افتراضي</SelectItem>
              {fontSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* التنسيق الأساسي */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="عريض"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="مائل"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="تحته خط"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* القوائم */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="قائمة نقطية"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="قائمة مرقمة"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* محاذاة النص */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="محاذاة لليمين"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="محاذاة للوسط"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="محاذاة لليسار"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="محاذاة متساوية"
        >
          <AlignJustify className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* الجداول */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="إدراج جدول"
            >
              <TableIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">جدول</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto bg-popover z-50" align="start">
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="w-full justify-start"
              >
                <TableIcon className="h-4 w-4 ml-2" />
                جدول سريع 3×3
              </Button>
              
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowTableDialog(true)}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 ml-2" />
                جدول مخصص
              </Button>
              
              <Separator />
              
              {editor.isActive('table') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().addRowBefore().run()}
                      title="إضافة صف قبل"
                    >
                      <Plus className="h-4 w-4" />
                      صف قبل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().addRowAfter().run()}
                      title="إضافة صف بعد"
                    >
                      <Plus className="h-4 w-4" />
                      صف بعد
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().addColumnBefore().run()}
                      title="إضافة عمود قبل"
                    >
                      <Plus className="h-4 w-4" />
                      عمود قبل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().addColumnAfter().run()}
                      title="إضافة عمود بعد"
                    >
                      <Plus className="h-4 w-4" />
                      عمود بعد
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().deleteRow().run()}
                      title="حذف صف"
                    >
                      <Minus className="h-4 w-4" />
                      حذف صف
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().deleteColumn().run()}
                      title="حذف عمود"
                    >
                      <Minus className="h-4 w-4" />
                      حذف عمود
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().mergeCells().run()}
                      disabled={!editor.can().mergeCells()}
                      title="دمج الخلايا"
                    >
                      <Merge className="h-4 w-4" />
                      دمج
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().splitCell().run()}
                      disabled={!editor.can().splitCell()}
                      title="تقسيم الخلية"
                    >
                      <Split className="h-4 w-4" />
                      تقسيم
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف الجدول
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* عروض Gamma التقديمية */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowGammaDialog(true)}
          className="h-8 px-2"
          title="إدراج عرض تقديمي من Gamma"
        >
          <Presentation className="h-4 w-4 mr-1" />
          <span className="text-xs">عرض تقديمي</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowHTMLDialog(true)}
          className="h-8 px-2"
          title="إدراج كود HTML تفاعلي"
        >
          <Code className="h-4 w-4 mr-1" />
          <span className="text-xs">HTML</span>
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* الصور */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={uploadingImage}
          />
          <label htmlFor="image-upload">
            <MenuButton
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={uploadingImage}
              title="إضافة صورة"
            >
              <ImagePlus className="h-4 w-4" />
            </MenuButton>
          </label>

        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* الألوان المحسنة */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="اختيار اللون"
            >
              <Palette className="h-4 w-4 mr-1" />
              <span className="text-xs">لون</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-popover z-50" align="start">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">ألوان سريعة</p>
                <div className="grid grid-cols-4 gap-2">
                  {quickColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => editor.chain().focus().setColor(color.value).run()}
                      className="w-full h-8 rounded border-2 hover:scale-105 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">لون مخصص</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="flex-1 h-8 px-2 text-sm border rounded bg-background"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <Separator />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="w-full"
              >
                إزالة اللون
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* منطقة المحرر */}
      <div className="relative">
        <EditorContent editor={editor} />
        
        {/* Bubble Menu للصور */}
      <ImageBubbleMenu
        editor={editor}
        onResize={handleImageResize}
        onCustomResize={handleCustomImageResize}
        onAlign={handleImageAlignment}
        onResetSize={handleResetImageSize}
        onDelete={handleDeleteImage}
      />
      </div>

      {/* Dialog لإدراج جدول مخصص */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إدراج جدول مخصص</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rows">عدد الصفوف (1-20)</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cols">عدد الأعمدة (1-10)</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                className="text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="header">إضافة صف رأسي</Label>
              <Switch
                id="header"
                checked={withHeaderRow}
                onCheckedChange={setWithHeaderRow}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              سيتم إنشاء جدول بـ {Math.max(1, Math.min(20, tableRows))} صف و {Math.max(1, Math.min(10, tableCols))} عمود
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleInsertTable}>
              إدراج الجدول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog لإدراج عرض تقديمي من Gamma */}
      <Dialog open={showGammaDialog} onOpenChange={setShowGammaDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>إدراج عرض تقديمي من Gamma</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gamma-url">رابط Embed من Gamma *</Label>
              <Input
                id="gamma-url"
                type="url"
                placeholder="https://gamma.app/embed/..."
                value={gammaUrl}
                onChange={(e) => {
                  setGammaUrl(e.target.value);
                  setGammaUrlError('');
                }}
                className={`text-right ${gammaUrlError ? 'border-destructive' : ''}`}
                dir="ltr"
              />
              {gammaUrlError && (
                <p className="text-sm text-destructive">{gammaUrlError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gamma-title">عنوان العرض (اختياري)</Label>
              <Input
                id="gamma-title"
                type="text"
                placeholder="عرض تقديمي من Gamma"
                value={gammaTitle}
                onChange={(e) => setGammaTitle(e.target.value)}
                className="text-right"
              />
            </div>

            <div className="space-y-2 p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">كيفية الحصول على رابط Embed:</p>
              <ol className="list-decimal pr-5 space-y-1 text-muted-foreground">
                <li>افتح العرض التقديمي في Gamma</li>
                <li>اضغط على زر "Share" أو "مشاركة"</li>
                <li>اختر "Embed" أو "تضمين"</li>
                <li>انسخ الرابط الذي يبدأ بـ <code className="text-xs bg-background px-1 py-0.5 rounded">https://gamma.app/embed/</code></li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGammaDialog(false);
              setGammaUrl('');
              setGammaTitle('');
              setGammaUrlError('');
            }}>
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
                  srcDoc={htmlCode}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  className="w-full h-full border-0"
                  title="معاينة مباشرة"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowHTMLDialog(false);
              setHtmlCode('');
              setHtmlTitle('محتوى HTML تفاعلي');
              setHtmlHeight('400px');
            }}>
              إلغاء
            </Button>
            <Button onClick={handleHTMLInsert}>إدراج المحتوى</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextEditor;
