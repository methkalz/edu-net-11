import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Type } from 'lucide-react';
import { useDisplaySettings } from '@/hooks/useDisplaySettings';
import { cn } from '@/lib/utils';

interface FontSizeControlProps {
  className?: string;
  showLabel?: boolean;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({ 
  className, 
  showLabel = false 
}) => {
  const { settings, increaseFontSize, decreaseFontSize } = useDisplaySettings();

  const fontSizeLabels = {
    'small': 'صغير',
    'medium': 'متوسط', 
    'large': 'كبير',
    'extra-large': 'كبير جداً'
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showLabel && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Type className="h-4 w-4" />
          <span className="hidden md:inline">حجم الخط:</span>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={decreaseFontSize}
        disabled={settings.fontSize === 'small'}
        className="opacity-70 hover:opacity-100 transition-opacity"
        title="تصغير الخط"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {showLabel && (
        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
          {fontSizeLabels[settings.fontSize]}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={increaseFontSize}
        disabled={settings.fontSize === 'extra-large'}
        className="opacity-70 hover:opacity-100 transition-opacity"
        title="تكبير الخط"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};