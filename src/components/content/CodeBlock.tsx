import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Play, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  fileName,
  showLineNumbers = true,
  theme = 'dark',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('تم نسخ الكود!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('فشل في نسخ الكود');
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    const languageNames: { [key: string]: string } = {
      cmd: 'Command Prompt',
      bash: 'Bash',
      python: 'Python',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      sql: 'SQL',
      json: 'JSON',
      yaml: 'YAML',
      xml: 'XML',
      php: 'PHP',
      java: 'Java',
      csharp: 'C#',
      cpp: 'C++',
      c: 'C',
      plaintext: 'Plain Text',
    };
    return languageNames[lang] || lang.toUpperCase();
  };

  const getLanguageIcon = (lang: string) => {
    if (['cmd', 'bash'].includes(lang)) {
      return <Terminal className="h-4 w-4" />;
    }
    return <Play className="h-4 w-4" />;
  };

  const lines = code.split('\n');

  const themeClasses = {
    dark: {
      container: 'bg-gray-900 border-gray-700',
      header: 'bg-gray-800 border-gray-700',
      content: 'bg-gray-900 text-gray-100',
      lineNumber: 'text-gray-500 bg-gray-800 border-gray-700',
      language: 'text-gray-300',
    },
    light: {
      container: 'bg-white border-gray-200',
      header: 'bg-gray-50 border-gray-200',
      content: 'bg-white text-gray-900',
      lineNumber: 'text-gray-400 bg-gray-50 border-gray-200',
      language: 'text-gray-600',
    },
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`rounded-lg border overflow-hidden code-ltr-container ${currentTheme.container} ${className}`}>
      {/* Header */}
      <div className={`px-4 py-2 border-b flex items-center justify-between ${currentTheme.header}`}>
        <div className="flex items-center gap-2">
          {getLanguageIcon(language)}
          <span className={`text-sm font-medium ${currentTheme.language}`}>
            {fileName || getLanguageDisplayName(language)}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto">
        <div className="flex">
          {showLineNumbers && (
            <div className={`px-2 py-4 text-sm font-mono border-l ${currentTheme.lineNumber}`}>
              {lines.map((_, index) => (
                <div key={index} className="leading-6 text-left">
                  {index + 1}
                </div>
              ))}
            </div>
          )}
          
          <div className={`flex-1 p-4 font-mono text-sm leading-6 ${currentTheme.content}`} dir="ltr">
            <pre className="whitespace-pre-wrap">
              {code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;