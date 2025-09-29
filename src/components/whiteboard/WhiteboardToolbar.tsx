import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  MousePointer,
  Undo2,
  Redo2,
  Trash2,
  Save,
  Download
} from "lucide-react";

interface WhiteboardToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const colors = [
  "#000000", // أسود
  "#FF0000", // أحمر
  "#00FF00", // أخضر
  "#0000FF", // أزرق
  "#FFFF00", // أصفر
  "#FF00FF", // وردي
  "#00FFFF", // سماوي
  "#FFA500", // برتقالي
];

export const WhiteboardToolbar = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onExport,
  canUndo,
  canRedo,
}: WhiteboardToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-4 bg-card border-b border-border flex-wrap">
      {/* أدوات الرسم */}
      <div className="flex gap-1">
        <Button
          variant={currentTool === "select" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("select")}
          title="تحديد"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === "pen" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("pen")}
          title="قلم"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === "eraser" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("eraser")}
          title="ممحاة"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* الأشكال */}
      <div className="flex gap-1">
        <Button
          variant={currentTool === "rectangle" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("rectangle")}
          title="مربع"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === "circle" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("circle")}
          title="دائرة"
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === "line" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("line")}
          title="خط"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={currentTool === "text" ? "default" : "outline"}
          size="icon"
          onClick={() => onToolChange("text")}
          title="نص"
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* الألوان */}
      <div className="flex gap-1">
        {colors.map((color) => (
          <button
            key={color}
            className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: currentColor === color ? "hsl(var(--primary))" : "hsl(var(--border))",
            }}
            onClick={() => onColorChange(color)}
            title={color}
          />
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* حجم الفرشاة */}
      <div className="flex items-center gap-2 min-w-[150px]">
        <span className="text-sm text-muted-foreground whitespace-nowrap">السماكة:</span>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          min={1}
          max={20}
          step={1}
          className="flex-1"
        />
        <span className="text-sm font-medium w-6">{brushSize}</span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* أدوات التراجع والإعادة */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="تراجع"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          title="إعادة"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* أدوات الحفظ والتصدير */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          title="مسح الكل"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onSave}
          title="حفظ"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onExport}
          title="تصدير كصورة"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};