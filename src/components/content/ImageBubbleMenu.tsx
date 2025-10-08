import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  AlignRight,
  AlignCenter,
  AlignLeft,
  Trash2,
  Percent,
} from 'lucide-react';

interface ImageBubbleMenuProps {
  editor: Editor;
  onResize: (width: string) => void;
  onAlign: (alignment: 'left' | 'center' | 'right') => void;
  onDelete: () => void;
}

const ImageBubbleMenu: React.FC<ImageBubbleMenuProps> = ({
  editor,
  onResize,
  onAlign,
  onDelete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!editor) return;

      const isImageActive = editor.isActive('image');
      setIsVisible(isImageActive);

      if (isImageActive) {
        const selection = editor.view.state.selection;
        const { from } = selection;
        const start = editor.view.coordsAtPos(from);
        
        // حساب الموقع
        const editorElement = editor.view.dom;
        const editorRect = editorElement.getBoundingClientRect();
        
        const menuWidth = menuRef.current?.offsetWidth || 400;
        const left = start.left - editorRect.left - menuWidth / 2;
        const top = start.top - editorRect.top - 60;

        setPosition({ top, left });
      }
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('update', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('update', updatePosition);
    };
  }, [editor]);

  if (!isVisible) return null;

  const MenuButton = ({
    onClick,
    children,
    title,
    variant = 'ghost' as const,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
    variant?: 'ghost' | 'outline';
  }) => (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={onClick}
      className="h-8 px-2"
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }}
      className="flex items-center gap-1 p-2 rounded-lg border bg-popover shadow-lg"
    >
      {/* أحجام سريعة */}
      <div className="flex items-center gap-1 pr-2 border-r">
        <MenuButton onClick={() => onResize('25%')} title="25%">
          <Percent className="h-3 w-3 ml-1" />
          <span className="text-xs">25</span>
        </MenuButton>
        <MenuButton onClick={() => onResize('50%')} title="50%">
          <Percent className="h-3 w-3 ml-1" />
          <span className="text-xs">50</span>
        </MenuButton>
        <MenuButton onClick={() => onResize('75%')} title="75%">
          <Percent className="h-3 w-3 ml-1" />
          <span className="text-xs">75</span>
        </MenuButton>
        <MenuButton onClick={() => onResize('100%')} title="100%">
          <Percent className="h-3 w-3 ml-1" />
          <span className="text-xs">100</span>
        </MenuButton>
      </div>

      {/* المحاذاة */}
      <div className="flex items-center gap-1 px-2 border-r">
        <MenuButton onClick={() => onAlign('right')} title="محاذاة لليمين">
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => onAlign('center')} title="محاذاة للوسط">
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => onAlign('left')} title="محاذاة لليسار">
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* حذف */}
      <div className="pr-2 border-r">
        <MenuButton onClick={onDelete} title="حذف الصورة">
          <Trash2 className="h-4 w-4 text-destructive" />
        </MenuButton>
      </div>
    </div>
  );
};

export default ImageBubbleMenu;
