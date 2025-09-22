import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = "اكتب المحتوى هنا..." 
}) => {
  const [isPreview, setIsPreview] = useState(false);

  const formatText = (format: string) => {
    // تطبيق التنسيق على النص المحدد
    const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      let formattedText = '';
      
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'underline':
          formattedText = `<u>${selectedText}</u>`;
          break;
        case 'h1':
          formattedText = `# ${selectedText}`;
          break;
        case 'h2':
          formattedText = `## ${selectedText}`;
          break;
        case 'h3':
          formattedText = `### ${selectedText}`;
          break;
        case 'quote':
          formattedText = `> ${selectedText}`;
          break;
        case 'list':
          formattedText = `- ${selectedText}`;
          break;
        case 'numbered-list':
          formattedText = `1. ${selectedText}`;
          break;
        case 'link':
          formattedText = `[${selectedText}](رابط)`;
          break;
        default:
          formattedText = selectedText;
      }
      
      const newContent = content.substring(0, start) + formattedText + content.substring(end);
      onChange(newContent);
    }
  };

  const insertImage = () => {
    const imageUrl = prompt('أدخل رابط الصورة:');
    if (imageUrl) {
      const imageMarkdown = `![وصف الصورة](${imageUrl})`;
      onChange(content + '\n' + imageMarkdown);
    }
  };

  const renderPreview = (text: string) => {
    // تحويل مبسط من Markdown إلى HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="list-disc list-inside">$1</li>')
      .replace(/^1\. (.*$)/gim, '<li class="list-decimal list-inside">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded border my-2" />')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className="p-2"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className="p-2"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className="p-2"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border"></div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('h1')}
            className="p-2"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('h2')}
            className="p-2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('h3')}
            className="p-2"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border"></div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('list')}
            className="p-2"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('numbered-list')}
            className="p-2"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('quote')}
            className="p-2"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border"></div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={insertImage}
            className="p-2"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('link')}
            className="p-2"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <div className="mr-auto">
          <Button
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? 'التحرير' : 'المعاينة'}
          </Button>
        </div>
      </div>

      {/* منطقة التحرير أو المعاينة */}
      {isPreview ? (
        <div 
          className="min-h-[300px] p-4 border rounded-lg bg-background prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
          dir="rtl"
        />
      ) : (
        <Textarea
          id="rich-editor"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[300px] resize-none font-mono"
          dir="rtl"
        />
      )}

      {/* مساعدة التنسيق */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
        <strong>اختصارات التنسيق:</strong>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          <span>**نص غامق**</span>
          <span>*نص مائل*</span>
          <span># عنوان كبير</span>
          <span>- قائمة نقطية</span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;