import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Circle, Square, Type, Eraser, Trash2, Undo2, Redo2, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export type DrawingTool = 'select' | 'pen' | 'circle' | 'rectangle' | 'text' | 'eraser' | 'line';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const colors = [
  '#000000', // أسود
  '#FFFFFF', // أبيض
  '#FF0000', // أحمر
  '#00FF00', // أخضر
  '#0000FF', // أزرق
  '#FFFF00', // أصفر
  '#FF00FF', // وردي
  '#00FFFF', // سماوي
];

const brushSizes = [2, 4, 6, 8, 12];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 flex flex-col gap-2 w-16">
      {/* أدوات الرسم */}
      <Button
        variant={activeTool === 'pen' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('pen')}
        title="قلم"
        className="w-10 h-10"
      >
        <Pencil className="h-5 w-5" />
      </Button>

      <Button
        variant={activeTool === 'circle' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('circle')}
        title="دائرة"
        className="w-10 h-10"
      >
        <Circle className="h-5 w-5" />
      </Button>

      <Button
        variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('rectangle')}
        title="مستطيل"
        className="w-10 h-10"
      >
        <Square className="h-5 w-5" />
      </Button>

      <Button
        variant={activeTool === 'line' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('line')}
        title="خط"
        className="w-10 h-10"
      >
        <Minus className="h-5 w-5" />
      </Button>

      <Button
        variant={activeTool === 'text' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('text')}
        title="نص"
        className="w-10 h-10"
      >
        <Type className="h-5 w-5" />
      </Button>

      <Button
        variant={activeTool === 'eraser' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onToolChange('eraser')}
        title="ممحاة"
        className="w-10 h-10"
      >
        <Eraser className="h-5 w-5" />
      </Button>

      <Separator className="my-1" />

      {/* الألوان */}
      <div className="flex flex-col gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-10 h-10 rounded border-2 transition-all ${
              activeColor === color ? 'border-primary scale-110' : 'border-border'
            }`}
            style={{ backgroundColor: color }}
            title={`لون ${color}`}
          />
        ))}
      </div>

      <Separator className="my-1" />

      {/* أحجام الفرشاة */}
      <div className="flex flex-col gap-1">
        {brushSizes.map((size) => (
          <button
            key={size}
            onClick={() => onBrushSizeChange(size)}
            className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
              brushSize === size ? 'border-primary bg-primary/10' : 'border-border'
            }`}
            title={`حجم ${size}`}
          >
            <div
              className="rounded-full bg-foreground"
              style={{ width: `${size}px`, height: `${size}px` }}
            />
          </button>
        ))}
      </div>

      <Separator className="my-1" />

      {/* أدوات التحكم */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        title="تراجع"
        className="w-10 h-10"
      >
        <Undo2 className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        title="إعادة"
        className="w-10 h-10"
      >
        <Redo2 className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        title="مسح الكل"
        className="w-10 h-10 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
};
