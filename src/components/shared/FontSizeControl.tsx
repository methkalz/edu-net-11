import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDisplaySettings } from '@/hooks/useDisplaySettings';

interface FontSizeControlProps {
  className?: string;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({ className = '' }) => {
  const { fontSize, increaseFontSize, decreaseFontSize } = useDisplaySettings();

  const canIncrease = fontSize !== 'extra-large';
  const canDecrease = fontSize !== 'small';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground min-w-[60px]">
        حجم الخط
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={decreaseFontSize}
          disabled={!canDecrease}
          className="h-8 w-8 p-0"
          title="تصغير الخط"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="text-xs bg-muted px-2 py-1 rounded min-w-[50px] text-center">
          {fontSize === 'small' && 'صغير'}
          {fontSize === 'medium' && 'متوسط'}
          {fontSize === 'large' && 'كبير'}
          {fontSize === 'extra-large' && 'كبير جداً'}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={increaseFontSize}
          disabled={!canIncrease}
          className="h-8 w-8 p-0"
          title="تكبير الخط"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};