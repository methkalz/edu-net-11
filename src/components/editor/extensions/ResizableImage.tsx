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
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const dimensionsTimeoutRef = useRef<NodeJS.Timeout>();
  const initialXRef = useRef<number>(0);
  const initialWidthRef = useRef<number>(0);

  const { src, alt, width, height, align } = node.attrs;

  // بدء السحب
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'left' | 'right') => {
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    initialXRef.current = e.clientX;
    initialWidthRef.current = imageRef.current?.offsetWidth || 400;
  }, []);

  // السحب - منطق Remotion المُثبت
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !imageRef.current) return;
    
    const offsetX = e.clientX - initialXRef.current;
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    
    // منطق مُثبت من Remotion: isLeft يعني handle على اليسار
    const isLeft = resizeHandle === 'left';
    
    // في LTR: left handle يعكس، right handle طبيعي
    // في RTL: نعكس المنطق بالكامل
    let newWidth: number;
    if (isRTL) {
      // RTL: نعكس كل شيء
      newWidth = initialWidthRef.current + (isLeft ? offsetX : -offsetX);
    } else {
      // LTR: المنطق الطبيعي
      newWidth = initialWidthRef.current + (isLeft ? -offsetX : offsetX);
    }
    
    // تطبيق حدود صارمة
    newWidth = Math.max(150, newWidth);
    const containerWidth = imageRef.current.parentElement?.offsetWidth || 1200;
    newWidth = Math.min(newWidth, containerWidth - 20);
    
    console.log('🖼️ Resize:', {
      handle: resizeHandle,
      rtl: isRTL,
      initialW: initialWidthRef.current,
      offsetX,
      newWidth: Math.round(newWidth)
    });
    
    updateAttributes({
      width: `${Math.round(newWidth)}px`,
      height: null,
    });
    
    setShowDimensions(true);
    if (dimensionsTimeoutRef.current) {
      clearTimeout(dimensionsTimeoutRef.current);
    }
    dimensionsTimeoutRef.current = setTimeout(() => {
      setShowDimensions(false);
    }, 1000);
  }, [isResizing, resizeHandle, updateAttributes]);

  // إنهاء السحب
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Touch events للأجهزة اللوحية
  const handleTouchStart = useCallback((e: React.TouchEvent, handle: 'left' | 'right') => {
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    const touch = e.touches[0];
    initialXRef.current = touch.clientX;
    initialWidthRef.current = imageRef.current?.offsetWidth || 400;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !resizeHandle || !imageRef.current || !e.touches[0]) return;
    
    const touch = e.touches[0];
    const offsetX = touch.clientX - initialXRef.current;
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    const isLeft = resizeHandle === 'left';
    
    let newWidth: number;
    if (isRTL) {
      newWidth = initialWidthRef.current + (isLeft ? offsetX : -offsetX);
    } else {
      newWidth = initialWidthRef.current + (isLeft ? -offsetX : offsetX);
    }
    
    newWidth = Math.max(150, newWidth);
    const containerWidth = imageRef.current.parentElement?.offsetWidth || 1200;
    newWidth = Math.min(newWidth, containerWidth - 20);
    
    updateAttributes({
      width: `${Math.round(newWidth)}px`,
      height: null,
    });
    
    setShowDimensions(true);
    if (dimensionsTimeoutRef.current) {
      clearTimeout(dimensionsTimeoutRef.current);
    }
    dimensionsTimeoutRef.current = setTimeout(() => {
      setShowDimensions(false);
    }, 1000);
  }, [isResizing, resizeHandle, updateAttributes]);

  const handleTouchEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
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
              onMouseDown={(e) => handleMouseDown(e, 'left')}
              onTouchStart={(e) => handleTouchStart(e, 'left')}
              style={{ touchAction: 'none' }}
            />
            
            {/* Handle يمين */}
            <div
              className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-12 bg-primary rounded-full cursor-ew-resize transition-opacity ${
                showControls || isResizing ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={(e) => handleMouseDown(e, 'right')}
              onTouchStart={(e) => handleTouchStart(e, 'right')}
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
        {showDimensions && imageRef.current && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border rounded px-3 py-1.5 text-sm font-medium shadow-lg">
            {Math.round(imageRef.current.offsetWidth)}px
            <span className="text-xs text-muted-foreground ml-2">
              {resizeHandle === 'left' ? '← يسار' : 'يمين →'}
            </span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
