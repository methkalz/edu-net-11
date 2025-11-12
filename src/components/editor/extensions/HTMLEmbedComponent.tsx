import { NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Trash2, Edit, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const HTMLEmbedComponent = ({ node, deleteNode, updateAttributes }: any) => {
  const { htmlContent, title, height } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(htmlContent);
  const [editTitle, setEditTitle] = useState(title);
  const [editHeight, setEditHeight] = useState(height);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const validateHTMLCode = (code: string): { isValid: boolean; error?: string } => {
    if (!code.trim()) {
      return { isValid: false, error: 'الكود فارغ' };
    }

    if (code.includes('<script src=') || code.includes('<script src =')) {
      return { isValid: false, error: 'لا يُسمح بتحميل scripts خارجية لأسباب أمنية' };
    }

    if (code.toLowerCase().includes('<iframe')) {
      return { isValid: false, error: 'لا يُسمح بتضمين iframes داخل الكود' };
    }

    return { isValid: true };
  };

  const handleSave = () => {
    const validation = validateHTMLCode(editContent);
    
    if (!validation.isValid) {
      toast({
        title: 'خطأ في التحقق',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    updateAttributes({
      htmlContent: editContent,
      title: editTitle,
      height: editHeight,
    });
    setIsEditing(false);
    toast({
      title: 'تم الحفظ',
      description: 'تم تحديث محتوى HTML بنجاح',
    });
  };

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
      deleteNode();
    }
  };

  const toggleFullscreen = async () => {
    const iframe = document.querySelector(`iframe[data-html-embed-id="${node.attrs.htmlContent.substring(0, 20)}"]`);
    const wrapper = iframe?.closest('.html-embed-wrapper');

    if (!iframe || !wrapper) return;

    try {
      if (!document.fullscreenElement) {
        await wrapper.requestFullscreen();
        setIsFullscreen(true);
        (iframe as HTMLElement).style.cssText = 'width: 100vw !important; height: 100vh !important; max-width: 100vw; max-height: 100vh; border-radius: 0;';
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        (iframe as HTMLElement).style.cssText = '';
      }
    } catch (error) {
      console.error('خطأ في تبديل وضع ملء الشاشة:', error);
    }
  };

  return (
    <>
      <NodeViewWrapper className="html-embed-wrapper my-4 relative group">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                title="تعديل"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                title="حذف"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div style={{ height }}>
            <iframe
              data-html-embed-id={htmlContent.substring(0, 20)}
              srcDoc={htmlContent}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="w-full h-full border-0"
              title={title}
            />
          </div>
        </div>
      </NodeViewWrapper>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>تعديل محتوى HTML</DialogTitle>
          </DialogHeader>
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col gap-3">
              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="عنوان المحتوى"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="height">الارتفاع</Label>
                <Select value={editHeight} onValueChange={setEditHeight}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300px">صغير (300px)</SelectItem>
                    <SelectItem value="400px">متوسط (400px)</SelectItem>
                    <SelectItem value="600px">كبير (600px)</SelectItem>
                    <SelectItem value="800px">كبير جداً (800px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <Label htmlFor="code">كود HTML</Label>
                <textarea
                  id="code"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
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
                  srcDoc={editContent}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  className="w-full h-full border-0"
                  title="معاينة مباشرة"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HTMLEmbedComponent;
