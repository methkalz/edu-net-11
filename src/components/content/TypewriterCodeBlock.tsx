import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Play, Pause, RotateCcw, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface TypewriterCodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
  theme?: 'dark' | 'light';
  speed?: number;
  autoStart?: boolean;
  autoRestart?: boolean;
  loop?: boolean;
  pauseDuration?: number;
  className?: string;
}

const TypewriterCodeBlock: React.FC<TypewriterCodeBlockProps> = ({
  code,
  language,
  fileName,
  showLineNumbers = true,
  theme = 'dark',
  speed = 50,
  autoStart = true,
  autoRestart = false,
  loop = false,
  pauseDuration = 4000,
  className = '',
}) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Reset state when code changes or component mounts
  useEffect(() => {
    logger.debug('TypewriterCodeBlock component mounted', { 
      codeLength: code.length, 
      codePreview: code.slice(0, 20) + (code.length > 20 ? '...' : ''), 
      autoStart, 
      loop, 
      autoRestart 
    });
    setDisplayedCode('');
    setCurrentIndex(0);
    setIsDeleting(false);
    setIsPaused(false);
    if (autoStart && code.length > 0) {
      setIsPlaying(true);
    }
  }, [code, autoStart]);

  useEffect(() => {
    if (!isPlaying || code.length === 0) return;

    // Handle pause state
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        if (loop || autoRestart) {
          setIsDeleting(true);
        } else {
          setIsPlaying(false);
        }
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (isDeleting) {
        // Deleting phase
        if (currentIndex > 0) {
          setDisplayedCode(code.slice(0, currentIndex - 1));
          setCurrentIndex(prev => prev - 1);
        } else {
          // Finished deleting, start typing again
          setIsDeleting(false);
          setCurrentIndex(0);
          setDisplayedCode('');
          logger.debug('TypewriterCodeBlock deletion cycle completed');
        }
      } else {
        // Typing phase
        if (currentIndex < code.length) {
          setDisplayedCode(code.slice(0, currentIndex + 1));
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished typing
          logger.debug('TypewriterCodeBlock typing completed', { currentIndex, codeLength: code.length, loop, autoRestart });
          if (loop || autoRestart) {
            setIsPaused(true);
          } else {
            setIsPlaying(false);
          }
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, isPaused, isDeleting, code, speed, loop, autoRestart, pauseDuration]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setDisplayedCode('');
    setIsPlaying(false);
    setIsDeleting(false);
    setIsPaused(false);
  };

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

  const lines = displayedCode.split('\n');
  const totalLines = code.split('\n').length;

  const themeClasses = {
    dark: {
      container: 'bg-gray-900 border-gray-700',
      header: 'bg-gray-800 border-gray-700',
      content: 'bg-gray-900 text-gray-100',
      lineNumber: 'text-gray-500 bg-gray-800 border-gray-700',
      language: 'text-gray-300',
      cursor: 'bg-green-400',
    },
    light: {
      container: 'bg-white border-gray-200',
      header: 'bg-gray-50 border-gray-200',
      content: 'bg-white text-gray-900',
      lineNumber: 'text-gray-400 bg-gray-50 border-gray-200',
      language: 'text-gray-600',
      cursor: 'bg-blue-500',
    },
  };

  const currentTheme = themeClasses[theme];
  const iconThemeClasses = theme === 'dark' ? 'text-white' : 'text-gray-600';

  return (
    <div className={`rounded-lg border overflow-hidden code-ltr-container ${currentTheme.container} ${className}`}>
      {/* Header */}
      <div className={`px-4 py-2 border-b flex items-center justify-start gap-4 ${currentTheme.header}`}>
        <div className="flex items-center gap-2">
          {getLanguageIcon(language)}
          <span className={`text-sm font-medium ${currentTheme.language}`}>
            {fileName || getLanguageDisplayName(language)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={`h-8 px-2 ${iconThemeClasses}`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className={`h-8 px-2 ${iconThemeClasses}`}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {!isPlaying ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className={`h-8 px-2 ${iconThemeClasses}`}
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePause}
              className={`h-8 px-2 ${iconThemeClasses}`}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto">
        <div className="flex">
          {showLineNumbers && (
            <div className={`px-2 py-4 text-sm font-mono border-l ${currentTheme.lineNumber}`}>
              {Array.from({ length: totalLines }, (_, index) => (
                <div key={index} className="leading-6 text-left">
                  {index + 1}
                </div>
              ))}
            </div>
          )}
          <div className={`flex-1 p-4 font-mono text-sm leading-6 ${currentTheme.content}`} style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}>
            <pre className="whitespace-pre-wrap relative" style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}>
              {displayedCode}
              {(isPlaying || currentIndex < code.length) && (
                <span className="inline-block w-0.5 h-5 bg-green-400 animate-cursor-blink ml-0.5">|</span>
              )}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TypewriterCodeBlock;