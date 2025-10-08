import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Ruler, Lock, Unlock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ImageSizePopoverProps {
  imageElement: HTMLImageElement | null;
  onApply: (width: string, height: string, unit: '%' | 'px') => void;
  children: React.ReactNode;
}

const ImageSizePopover: React.FC<ImageSizePopoverProps> = ({
  imageElement,
  onApply,
  children,
}) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'%' | 'px'>('%');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (imageElement && open) {
      const currentWidth = imageElement.offsetWidth;
      const currentHeight = imageElement.offsetHeight;
      
      // الحصول على الأبعاد الأصلية
      const img = new window.Image();
      img.src = imageElement.src;
      img.onload = () => {
        setOriginalWidth(img.naturalWidth);
        setOriginalHeight(img.naturalHeight);
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      };

      // تحديد الوحدة الحالية
      const currentStyle = imageElement.style.width;
      if (currentStyle.includes('%')) {
        setUnit('%');
        setWidth(currentStyle.replace('%', ''));
      } else if (currentStyle.includes('px')) {
        setUnit('px');
        setWidth(currentStyle.replace('px', ''));
      } else {
        setUnit('px');
        setWidth(currentWidth.toString());
      }
      
      setHeight(currentHeight.toString());
    }
  }, [imageElement, open]);

  const handleWidthChange = (value: string) => {
    setWidth(value);
    if (lockAspectRatio && value && aspectRatio) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const newHeight = Math.round(numValue / aspectRatio);
        setHeight(newHeight.toString());
      }
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (lockAspectRatio && value && aspectRatio) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const newWidth = Math.round(numValue * aspectRatio);
        setWidth(newWidth.toString());
      }
    }
  };

  const handleApply = () => {
    if (width && height) {
      onApply(width, height, unit);
      setOpen(false);
    }
  };

  const handleReset = () => {
    if (unit === 'px') {
      setWidth(originalWidth.toString());
      setHeight(originalHeight.toString());
    } else {
      setWidth('100');
      setHeight('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover" align="start" side="top">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">تحديد حجم الصورة</h4>
            <p className="text-xs text-muted-foreground">
              الحجم الأصلي: {originalWidth} × {originalHeight} بكسل
            </p>
          </div>

          <Separator />

          {/* الوحدة */}
          <div className="flex items-center gap-2">
            <Label className="text-xs">الوحدة:</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={unit === '%' ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-3"
                onClick={() => setUnit('%')}
              >
                %
              </Button>
              <Button
                type="button"
                variant={unit === 'px' ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-3"
                onClick={() => setUnit('px')}
              >
                px
              </Button>
            </div>
          </div>

          {/* العرض */}
          <div className="space-y-2">
            <Label htmlFor="width" className="text-sm">العرض</Label>
            <div className="flex items-center gap-2">
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="h-9"
                min="1"
                max={unit === '%' ? 100 : originalWidth}
              />
              <span className="text-sm text-muted-foreground min-w-[30px]">{unit}</span>
            </div>
          </div>

          {/* الطول */}
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm">الطول</Label>
            <div className="flex items-center gap-2">
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="h-9"
                min="1"
                disabled={lockAspectRatio}
              />
              <span className="text-sm text-muted-foreground min-w-[30px]">px</span>
            </div>
          </div>

          {/* قفل نسبة العرض للطول */}
          <div className="flex items-center justify-between">
            <Label htmlFor="lock-ratio" className="text-sm flex items-center gap-2">
              {lockAspectRatio ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              قفل نسبة الأبعاد
            </Label>
            <Switch
              id="lock-ratio"
              checked={lockAspectRatio}
              onCheckedChange={setLockAspectRatio}
            />
          </div>

          <Separator />

          {/* الأزرار */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
            >
              إعادة تعيين
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              تطبيق
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ImageSizePopover;
