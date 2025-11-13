import { NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Trash2, Edit, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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

  const handleSave = async () => {
    const validation = await validateHTMLCode(editContent);
    
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
    const card = wrapper?.querySelector('.bg-card');
    const iframeContainer = iframe?.parentElement;

    if (!iframe || !wrapper) return;

    try {
      if (!document.fullscreenElement) {
        await wrapper.requestFullscreen();
        setIsFullscreen(true);
        (wrapper as HTMLElement).style.cssText = 'width: 100vw !important; height: 100vh !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.95) !important; overflow: hidden !important;';
        if (card) (card as HTMLElement).style.cssText = 'width: 95vw !important; height: 95vh !important; max-width: 95vw !important; max-height: 95vh !important; border-radius: 8px !important; overflow: hidden !important;';
        if (iframeContainer) (iframeContainer as HTMLElement).style.cssText = 'width: 100% !important; height: 100% !important; overflow: hidden !important;';
        (iframe as HTMLElement).style.cssText = 'display: block !important; width: 100% !important; height: 100% !important; border: none !important;';
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        (wrapper as HTMLElement).style.cssText = '';
        if (card) (card as HTMLElement).style.cssText = '';
        if (iframeContainer) (iframeContainer as HTMLElement).style.cssText = `height: ${height}`;
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
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">ملاحظة أمنية</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  يُسمح فقط بتحميل scripts من CDNs موثوقة عبر HTTPS. 
                  يمكن للسوبر آدمن إدارة القائمة من لوحة التحكم.
                </p>
              </div>
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
                <Label htmlFor="height">الارتفاع (مثال: 400px، 50vh، 600px)</Label>
                <Input
                  id="height"
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  placeholder="400px"
                  className="mt-1"
                />
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
