import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, Plus, Minus } from 'lucide-react';
import { useDisplaySettings, FontSize } from '@/hooks/useDisplaySettings';
import { cn } from '@/lib/utils';

export const DisplaySettings: React.FC = () => {
  const { fontSize, theme, updateFontSize, toggleTheme, setTheme } = useDisplaySettings();

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'صغير' },
    { value: 'medium', label: 'متوسط' },
    { value: 'large', label: 'كبير' },
    { value: 'extra-large', label: 'كبير جداً' }
  ];

  const themeOptions = [
    { value: 'light', label: 'نهاري', icon: Sun },
    { value: 'dark', label: 'ليلي', icon: Moon },
    { value: 'system', label: 'تلقائي', icon: Monitor }
  ];

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            الوضع المرئي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={theme === option.value ? "default" : "outline"}
                  onClick={() => setTheme(option.value)}
                  className="flex flex-col gap-2 h-auto py-4"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Font Size Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            حجم الخط
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {fontSizes.map((size) => (
              <Button
                key={size.value}
                variant={fontSize === size.value ? "default" : "outline"}
                onClick={() => updateFontSize(size.value)}
                className={cn(
                  "justify-center py-3",
                  fontSize === size.value && "ring-2 ring-primary"
                )}
              >
                {size.label}
              </Button>
            ))}
          </div>
          
          {/* Preview Text */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-foreground mb-2">
              معاينة النص:
            </p>
            <p className="text-muted-foreground">
              هذا مثال على النص بالحجم المختار. يمكنك رؤية كيف سيظهر المحتوى بهذا الحجم.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};