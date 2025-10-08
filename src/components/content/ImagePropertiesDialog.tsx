import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImagePropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageElement: HTMLImageElement | null;
  onApply: (properties: ImageProperties) => void;
}

export interface ImageProperties {
  width: string;
  height: string;
  unit: 'px' | '%';
  rotation: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
  borderRadius: number;
  shadowIntensity: number;
  shadowColor: string;
  caption: string;
  alignment: 'left' | 'center' | 'right';
}

const ImagePropertiesDialog: React.FC<ImagePropertiesDialogProps> = ({
  open,
  onOpenChange,
  imageElement,
  onApply,
}) => {
  const [properties, setProperties] = useState<ImageProperties>({
    width: '100',
    height: 'auto',
    unit: '%',
    rotation: 0,
    borderWidth: 0,
    borderColor: '#000000',
    borderStyle: 'solid',
    borderRadius: 0,
    shadowIntensity: 0,
    shadowColor: '#000000',
    caption: '',
    alignment: 'center',
  });

  useEffect(() => {
    if (imageElement && open) {
      // استخراج الخصائص الحالية من الصورة
      const currentWidth = imageElement.style.width || '100%';
      const rotation = imageElement.getAttribute('data-rotation') || '0';
      const borderWidth = imageElement.getAttribute('data-border-width') || '0';
      const borderColor = imageElement.getAttribute('data-border-color') || '#000000';
      const borderStyle = imageElement.getAttribute('data-border-style') || 'solid';
      const borderRadius = imageElement.getAttribute('data-border-radius') || '0';
      const shadowIntensity = imageElement.getAttribute('data-shadow-intensity') || '0';
      const shadowColor = imageElement.getAttribute('data-shadow-color') || '#000000';
      const caption = imageElement.getAttribute('data-caption') || '';
      const alignment = imageElement.getAttribute('data-alignment') as 'left' | 'center' | 'right' || 'center';

      const unit = currentWidth.includes('%') ? '%' : 'px';
      const widthValue = parseFloat(currentWidth);

      setProperties({
        width: widthValue.toString(),
        height: 'auto',
        unit,
        rotation: parseFloat(rotation),
        borderWidth: parseFloat(borderWidth),
        borderColor,
        borderStyle,
        borderRadius: parseFloat(borderRadius),
        shadowIntensity: parseFloat(shadowIntensity),
        shadowColor,
        caption,
        alignment,
      });
    }
  }, [imageElement, open]);

  const handleApply = () => {
    onApply(properties);
    onOpenChange(false);
  };

  const handleReset = () => {
    setProperties({
      width: '100',
      height: 'auto',
      unit: '%',
      rotation: 0,
      borderWidth: 0,
      borderColor: '#000000',
      borderStyle: 'solid',
      borderRadius: 0,
      shadowIntensity: 0,
      shadowColor: '#000000',
      caption: '',
      alignment: 'center',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>خصائص الصورة المتقدمة</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="size" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="size">الحجم والموضع</TabsTrigger>
            <TabsTrigger value="style">التنسيق</TabsTrigger>
            <TabsTrigger value="effects">التأثيرات</TabsTrigger>
          </TabsList>

          <TabsContent value="size" className="space-y-4 mt-4">
            {/* الأبعاد */}
            <div className="space-y-2">
              <Label>العرض</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max={properties.unit === '%' ? '100' : '2000'}
                  value={properties.width}
                  onChange={(e) =>
                    setProperties({ ...properties, width: e.target.value })
                  }
                  className="flex-1"
                />
                <Select
                  value={properties.unit}
                  onValueChange={(value: 'px' | '%') =>
                    setProperties({ ...properties, unit: value })
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="px">px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* المحاذاة */}
            <div className="space-y-2">
              <Label>المحاذاة</Label>
              <Select
                value={properties.alignment}
                onValueChange={(value: 'left' | 'center' | 'right') =>
                  setProperties({ ...properties, alignment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">يمين</SelectItem>
                  <SelectItem value="center">وسط</SelectItem>
                  <SelectItem value="left">يسار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الدوران */}
            <div className="space-y-2">
              <Label>الدوران: {properties.rotation}°</Label>
              <Slider
                value={[properties.rotation]}
                onValueChange={(value) =>
                  setProperties({ ...properties, rotation: value[0] })
                }
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* التعليق */}
            <div className="space-y-2">
              <Label>التعليق التوضيحي</Label>
              <Input
                value={properties.caption}
                onChange={(e) =>
                  setProperties({ ...properties, caption: e.target.value })
                }
                placeholder="أضف تعليقاً توضيحياً..."
              />
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* الحدود */}
            <div className="space-y-2">
              <Label>سماكة الحدود: {properties.borderWidth}px</Label>
              <Slider
                value={[properties.borderWidth]}
                onValueChange={(value) =>
                  setProperties({ ...properties, borderWidth: value[0] })
                }
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {properties.borderWidth > 0 && (
              <>
                <div className="space-y-2">
                  <Label>لون الحدود</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={properties.borderColor}
                      onChange={(e) =>
                        setProperties({ ...properties, borderColor: e.target.value })
                      }
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={properties.borderColor}
                      onChange={(e) =>
                        setProperties({ ...properties, borderColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نمط الحدود</Label>
                  <Select
                    value={properties.borderStyle}
                    onValueChange={(value) =>
                      setProperties({ ...properties, borderStyle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">صلب</SelectItem>
                      <SelectItem value="dashed">متقطع</SelectItem>
                      <SelectItem value="dotted">نقطي</SelectItem>
                      <SelectItem value="double">مزدوج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* استدارة الزوايا */}
            <div className="space-y-2">
              <Label>استدارة الزوايا: {properties.borderRadius}px</Label>
              <Slider
                value={[properties.borderRadius]}
                onValueChange={(value) =>
                  setProperties({ ...properties, borderRadius: value[0] })
                }
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 mt-4">
            {/* الظل */}
            <div className="space-y-2">
              <Label>شدة الظل: {properties.shadowIntensity}px</Label>
              <Slider
                value={[properties.shadowIntensity]}
                onValueChange={(value) =>
                  setProperties({ ...properties, shadowIntensity: value[0] })
                }
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            {properties.shadowIntensity > 0 && (
              <div className="space-y-2">
                <Label>لون الظل</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={properties.shadowColor}
                    onChange={(e) =>
                      setProperties({ ...properties, shadowColor: e.target.value })
                    }
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={properties.shadowColor}
                    onChange={(e) =>
                      setProperties({ ...properties, shadowColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {/* معاينة */}
            <div className="space-y-2">
              <Label>المعاينة</Label>
              <div className="border rounded-lg p-4 bg-muted/20 flex items-center justify-center min-h-[200px]">
                {imageElement && (
                  <div
                    style={{
                      textAlign: properties.alignment,
                      width: '100%',
                    }}
                  >
                    <img
                      src={imageElement.src}
                      alt="معاينة"
                      style={{
                        display: 'inline-block',
                        maxWidth: '100%',
                        width: properties.unit === '%' ? `${properties.width}%` : `${properties.width}px`,
                        height: 'auto',
                        transform: `rotate(${properties.rotation}deg)`,
                        border: `${properties.borderWidth}px ${properties.borderStyle} ${properties.borderColor}`,
                        borderRadius: `${properties.borderRadius}px`,
                        boxShadow: properties.shadowIntensity > 0
                          ? `0 ${properties.shadowIntensity}px ${properties.shadowIntensity * 2}px ${properties.shadowColor}40`
                          : 'none',
                      }}
                    />
                    {properties.caption && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {properties.caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            إعادة تعيين
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleApply}>تطبيق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePropertiesDialog;
