import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import { Underline } from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List,
  ListOrdered,
  Undo,
  Redo,
  Palette,
  Type
} from 'lucide-react';
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
  
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'min-h-[1.5em]',
        },
      }),
      Text,
      BoldExtension,
      ItalicExtension,
      Underline,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pr-6 my-2',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal pr-6 my-2',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-1',
        },
      }),
      FontSize,
      FontFamily,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] focus:outline-none p-4 border rounded-md [&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6 [&_li]:my-1',
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
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
