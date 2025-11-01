import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Eye, Trash2, Code, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const TinyMCETestBlock: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleClear = () => {
    setContent('');
    toast({
      title: "تم المسح",
      description: "تم مسح محتوى المحرر بنجاح",
    });
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "تم النسخ",
      description: "تم نسخ كود HTML للحافظة",
    });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <Editor
          apiKey="zl84avh3o5gxv5dhx2ldgjnqi72r040qo5ixdj8hpehffbht"
          value={content}
          onEditorChange={handleEditorChange}
          init={{
            height: 400,
            directionality: 'rtl',
            language: 'ar',
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
              'preview', 'anchor', 'searchreplace', 'visualblocks',
              'code', 'fullscreen', 'insertdatetime', 'media',
              'table', 'help', 'wordcount'
            ],
            toolbar:
              'undo redo | formatselect | bold italic underline strikethrough | ' +
              'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
              'bullist numlist outdent indent | link image media | ' +
              'table | code preview fullscreen | help',
            content_style:
              'body { font-family: Cairo, Arial, sans-serif; font-size: 16px; direction: rtl; text-align: right; padding: 10px; }',
            language_url: 'https://cdn.tiny.cloud/1/zl84avh3o5gxv5dhx2ldgjnqi72r040qo5ixdj8hpehffbht/tinymce/6/langs/ar.js',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          onClick={handlePreview}
          variant="default"
          className="gap-2"
          disabled={!content}
        >
          <Eye className="h-4 w-4" />
          معاينة
        </Button>
        <Button
          onClick={handleCopyHTML}
          variant="outline"
          className="gap-2"
          disabled={!content}
        >
          <Code className="h-4 w-4" />
          نسخ HTML
        </Button>
        <Button
          onClick={handleClear}
          variant="destructive"
          className="gap-2"
          disabled={!content}
        >
          <Trash2 className="h-4 w-4" />
          مسح
        </Button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">معاينة المحتوى</DialogTitle>
          </DialogHeader>
          <div
            className="prose prose-lg max-w-none p-6 bg-muted/30 rounded-lg"
            style={{ direction: 'rtl', textAlign: 'right' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TinyMCETestBlock;
