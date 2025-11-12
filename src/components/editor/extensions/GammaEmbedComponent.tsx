import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2, Edit, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GammaEmbedComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    title: node.attrs.title,
    width: node.attrs.width,
    height: node.attrs.height,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleSave = () => {
    updateAttributes(editValues);
    setIsEditing(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('خطأ في تبديل وضع ملء الشاشة:', error);
    }
  };

  return (
    <NodeViewWrapper className="gamma-embed-node">
      <div
        ref={wrapperRef}
        className={`relative group rounded-lg overflow-hidden ${
          selected ? 'ring-2 ring-primary' : ''
        } ${isFullscreen ? 'bg-black flex items-center justify-center' : ''}`}
        style={{ margin: '1rem 0' }}
      >
        {/* Controls overlay - يظهر عند hover */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm"
            title="تعديل الإعدادات"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm"
            title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={deleteNode}
            className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
            title="حذف العرض"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">جاري تحميل العرض التقديمي...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center p-8 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="text-center">
              <p className="text-destructive font-medium mb-2">فشل تحميل العرض التقديمي</p>
              <p className="text-sm text-muted-foreground mb-4">تحقق من الرابط وحاول مرة أخرى</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setError(false);
                  setIsLoading(true);
                }}
              >
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* Iframe */}
        {!error && (
          <iframe
            src={node.attrs.src}
            title={node.attrs.title}
            width={node.attrs.width}
            height={node.attrs.height}
            frameBorder="0"
            sandbox="allow-scripts allow-same-origin allow-fullscreen"
            allow="fullscreen"
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className="w-full rounded-lg shadow-md"
            style={{
              maxWidth: '100%',
              minHeight: '450px',
            }}
          />
        )}

        {/* Title caption */}
        <div className="mt-2 text-center">
          <p className="text-sm text-muted-foreground">{node.attrs.title}</p>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل إعدادات العرض التقديمي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues({ ...editValues, title: e.target.value })
                }
                placeholder="عنوان العرض التقديمي"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">العرض</Label>
                <Input
                  id="width"
                  value={editValues.width}
                  onChange={(e) =>
                    setEditValues({ ...editValues, width: e.target.value })
                  }
                  placeholder="100%"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">الارتفاع</Label>
                <Input
                  id="height"
                  value={editValues.height}
                  onChange={(e) =>
                    setEditValues({ ...editValues, height: e.target.value })
                  }
                  placeholder="450px"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
};

export default GammaEmbedComponent;
