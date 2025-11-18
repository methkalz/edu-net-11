import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ResizableImage Extension
export const ResizableImageExtension = Image.extend({
  name: 'resizableImage',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width,
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height') || element.style.height,
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: attributes => {
          return { 'data-align': attributes.align };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

// ResizableImage Component
interface ResizableImageComponentProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
  selected: boolean;
  editor: any;
}

const ResizableImageComponent: React.FC<ResizableImageComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startWidthRef = useRef<number>(0);
  const startXRef = useRef<number>(0);

  const { src, alt, width, height, align } = node.attrs;

  // حساب العرض الفعلي
  const getEffectiveWidth = useCallback(() => {
    if (!imageRef.current) return 0;
    
    if (width) {
      // إذا كان width محدد، استخدمه
      if (typeof width === 'string' && width.includes('%')) {
        const percentage = parseFloat(width);
        const containerWidth = imageRef.current.parentElement?.offsetWidth || 800;
        return (containerWidth * percentage) / 100;
      } else if (typeof width === 'string' && width.includes('px')) {
        return parseFloat(width);
      } else if (typeof width === 'number') {
        return width;
      }
    }
    
    // إذا لم يكن محدد، استخدم العرض الطبيعي أو عرض الحاوية
    return imageRef.current.naturalWidth || imageRef.current.offsetWidth || 400;
  }, [width]);

  // بدء السحب
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startWidthRef.current = getEffectiveWidth();
    startXRef.current = e.clientX;
  }, [getEffectiveWidth]);

  // السحب
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    // في RTL، نحتاج لعكس الاتجاه
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    const actualDelta = isRTL ? -deltaX : deltaX;
    
    let newWidth = startWidthRef.current + actualDelta * 2; // *2 لأن التغيير من جانبين
    
    // تطبيق حد أدنى 150px
    newWidth = Math.max(150, newWidth);
    
    // تطبيق حد أقصى (عرض الحاوية)
    const containerWidth = imageRef.current?.parentElement?.offsetWidth || 1200;
    newWidth = Math.min(newWidth, containerWidth);
    
    updateAttributes({ width: `${Math.round(newWidth)}px`, height: null });
  }, [isResizing, updateAttributes]);

  // إنهاء السحب
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Touch events للأجهزة اللوحية
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsResizing(true);
    startWidthRef.current = getEffectiveWidth();
    startXRef.current = touch.clientX;
  }, [getEffectiveWidth]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    const actualDelta = isRTL ? -deltaX : deltaX;
    
    let newWidth = startWidthRef.current + actualDelta * 2;
    newWidth = Math.max(150, newWidth);
    
    const containerWidth = imageRef.current?.parentElement?.offsetWidth || 1200;
    newWidth = Math.min(newWidth, containerWidth);
    
    updateAttributes({ width: `${Math.round(newWidth)}px`, height: null });
  }, [isResizing, updateAttributes]);

  const handleTouchEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // إضافة event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // محاذاة الصورة
  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right') => {
    updateAttributes({ align: alignment });
  }, [updateAttributes]);

  // حذف الصورة
  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  // ملء الشاشة
  const handleFullscreen = useCallback(() => {
    if (imageRef.current) {
      if (imageRef.current.requestFullscreen) {
        imageRef.current.requestFullscreen();
      }
    }
  }, []);

  // تحديد الستايل بناءً على المحاذاة
  const getContainerStyle = useCallback(() => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      margin: '20px 0',
      position: 'relative',
    };

    switch (align) {
      case 'left':
        return { ...baseStyle, justifyContent: 'flex-start' };
      case 'right':
        return { ...baseStyle, justifyContent: 'flex-end' };
      case 'center':
      default:
        return { ...baseStyle, justifyContent: 'center' };
    }
  }, [align]);

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={getContainerStyle()}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isResizing && setShowControls(false)}
    >
      <div
        className={`relative inline-block ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        style={{ maxWidth: '100%' }}
      >
        {/* الصورة */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          style={{
            width: width || 'auto',
            height: height || 'auto',
            maxWidth: '100%',
            display: 'block',
            borderRadius: '8px',
            cursor: isResizing ? 'ew-resize' : 'default',
          }}
        />

        {/* Drag Handles */}
        {!editor.isEditable ? null : (
          <>
            {/* Handle يسار */}
            <div
              className={`absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-3 h-12 bg-primary rounded-full cursor-ew-resize transition-opacity ${
                showControls || isResizing ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ touchAction: 'none' }}
            />
            
            {/* Handle يمين */}
            <div
              className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-12 bg-primary rounded-full cursor-ew-resize transition-opacity ${
                showControls || isResizing ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ touchAction: 'none' }}
            />
          </>
        )}

        {/* Toolbar */}
        {!editor.isEditable ? null : (
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-lg p-1 shadow-lg transition-opacity ${
              showControls || selected ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              size="sm"
              variant={align === 'left' ? 'default' : 'ghost'}
              onClick={() => handleAlign('left')}
              className="h-7 w-7 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={align === 'center' ? 'default' : 'ghost'}
              onClick={() => handleAlign('center')}
              className="h-7 w-7 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={align === 'right' ? 'default' : 'ghost'}
              onClick={() => handleAlign('right')}
              className="h-7 w-7 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFullscreen}
              className="h-7 w-7 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* عرض الأبعاد أثناء التحجيم */}
        {isResizing && (
          <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur-sm border rounded px-2 py-1 text-xs font-medium">
            {Math.round(getEffectiveWidth())}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
