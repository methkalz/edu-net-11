import React from 'react';
import { Settings, Moon, Sun, User, LogOut, Type, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useFontSize, FontSize } from '@/hooks/useFontSize';

interface QuickSettingsProps {
  onSettingsClick?: () => void;
  onThemeToggle?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  className?: string;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  onSettingsClick,
  onThemeToggle,
  onProfileClick,
  onLogout,
  isDarkMode = false,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Theme Toggle */}
      {onThemeToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onThemeToggle}
          className="opacity-70 hover:opacity-100 transition-opacity"
          title={isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      )}

      {/* Profile Settings */}
      {onProfileClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onProfileClick}
          className="opacity-70 hover:opacity-100 transition-opacity"
          title="ملف الشخصي"
        >
          <User className="h-4 w-4" />
        </Button>
      )}

      {/* Settings Popover */}
      {onSettingsClick && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-70 hover:opacity-100 transition-opacity"
              title="الإعدادات"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <FontSizeSettings />
            
            <Separator className="my-3" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="w-full justify-between hover:bg-accent"
            >
              <span>الإعدادات الكاملة</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PopoverContent>
        </Popover>
      )}

      {/* Logout */}
      {onLogout && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline mr-2">خروج</span>
        </Button>
      )}
    </div>
  );
};

// Font Size Settings Component
const FontSizeSettings: React.FC = () => {
  const { fontSize, setFontSize, fontSizeConfig } = useFontSize();
  
  const fontSizes: FontSize[] = ['small', 'normal', 'large', 'xlarge'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Type className="h-4 w-4" />
        <span>حجم النص</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {fontSizes.map((size) => (
          <Button
            key={size}
            variant={fontSize === size ? "default" : "outline"}
            size="sm"
            onClick={() => setFontSize(size)}
            className={cn(
              "text-xs transition-all",
              fontSize === size && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {fontSizeConfig[size].label}
          </Button>
        ))}
      </div>
    </div>
  );
};