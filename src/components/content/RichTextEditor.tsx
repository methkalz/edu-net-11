import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Palette
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] focus:outline-none p-4 border rounded-md',
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
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  const colors = [
    { name: 'أسود', value: '#000000' },
    { name: 'أحمر', value: '#dc2626' },
    { name: 'أزرق', value: '#2563eb' },
    { name: 'أخضر', value: '#16a34a' },
    { name: 'برتقالي', value: '#ea580c' },
    { name: 'بنفسجي', value: '#9333ea' },
  ];

  return (
    <div className="border rounded-md">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* التراجع والإعادة */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* العناوين */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* التنسيق الأساسي */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* القوائم */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* الألوان */}
        <div className="flex items-center gap-1">
          <Palette className="h-4 w-4 text-muted-foreground mr-1" />
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => editor.chain().focus().setColor(color.value).run()}
              className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="h-6 text-xs px-2"
          >
            إزالة
          </Button>
        </div>
      </div>

      {/* منطقة المحرر */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
