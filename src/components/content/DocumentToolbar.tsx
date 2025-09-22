import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image,
  Table,
  Undo,
  Redo
} from 'lucide-react';

interface DocumentToolbarProps {
  onContentChange?: (content: string, wordCount: number, pageCount: number) => void;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({ onContentChange }) => {
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Trigger content change event
    const content = document.getSelection()?.focusNode?.parentElement?.innerHTML || '';
    // This is a simplified trigger - in real implementation, you'd get the full document content
  };

  const formatButtons = [
    { icon: Bold, command: 'bold', title: 'غامق' },
    { icon: Italic, command: 'italic', title: 'مائل' },
    { icon: Underline, command: 'underline', title: 'مسطر' }
  ];

  const alignButtons = [
    { icon: AlignRight, command: 'justifyRight', title: 'محاذاة يمين' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'توسيط' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'محاذاة يسار' },
    { icon: AlignJustify, command: 'justifyFull', title: 'ضبط' }
  ];

  const handleInsertTable = () => {
    const rows = prompt('عدد الصفوف:', '3');
    const cols = prompt('عدد الأعمدة:', '3');
    
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      
      executeCommand('insertHTML', tableHTML);
    }
  };

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = `<img src="${e.target?.result}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
          executeCommand('insertHTML', img);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-background border-b border-border overflow-x-auto no-print">
      {/* Undo/Redo */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => executeCommand('undo')}
        title="تراجع"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => executeCommand('redo')}
        title="إعادة"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Text formatting */}
      {formatButtons.map((button) => (
        <Button
          key={button.command}
          variant="ghost"
          size="sm"
          onClick={() => executeCommand(button.command)}
          title={button.title}
        >
          <button.icon className="h-4 w-4" />
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment */}
      {alignButtons.map((button) => (
        <Button
          key={button.command}
          variant="ghost"
          size="sm"
          onClick={() => executeCommand(button.command)}
          title={button.title}
        >
          <button.icon className="h-4 w-4" />
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => executeCommand('insertUnorderedList')}
        title="قائمة نقطية"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => executeCommand('insertOrderedList')}
        title="قائمة مرقمة"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Insert elements */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleInsertImage}
        title="إدراج صورة"
      >
        <Image className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleInsertTable}
        title="إدراج جدول"
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DocumentToolbar;