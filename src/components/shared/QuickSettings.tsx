import React from 'react';
import { Settings, Moon, Sun, User, LogOut, Plus, Minus, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDisplaySettings, FontSize } from '@/hooks/useDisplaySettings';

interface QuickSettingsProps {
  onProfileClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  onProfileClick,
  onLogout,
  className
}) => {
  const { fontSize, theme, updateFontSize, toggleTheme, setTheme } = useDisplaySettings();

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'صغير' },
    { value: 'medium', label: 'متوسط' },
    { value: 'large', label: 'كبير' },
    { value: 'extra-large', label: 'كبير جداً' }
  ];

  const getCurrentFontLabel = () => {
    return fontSizes.find(f => f.value === fontSize)?.label || 'متوسط';
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return Moon;
    if (theme === 'light') return Sun;
    return Monitor;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'ليلي';
    if (theme === 'light') return 'نهاري';
    return 'تلقائي';
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className={cn("flex items-center gap-2", className)}>
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

      {/* Settings Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-70 hover:opacity-100 transition-opacity"
            title="الإعدادات"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background/95 backdrop-blur-sm border shadow-lg"
          style={{ zIndex: 50 }}
        >
          <DropdownMenuLabel className="text-right">إعدادات العرض</DropdownMenuLabel>
          
          {/* Theme Section */}
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className={cn("flex items-center justify-between cursor-pointer", 
              theme === 'light' && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>نهاري</span>
            </div>
            {theme === 'light' && <div className="w-2 h-2 bg-primary rounded-full" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className={cn("flex items-center justify-between cursor-pointer",
              theme === 'dark' && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>ليلي</span>
            </div>
            {theme === 'dark' && <div className="w-2 h-2 bg-primary rounded-full" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className={cn("flex items-center justify-between cursor-pointer",
              theme === 'system' && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>تلقائي</span>
            </div>
            {theme === 'system' && <div className="w-2 h-2 bg-primary rounded-full" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-right">حجم الخط</DropdownMenuLabel>
          
          {/* Font Size Section */}
          {fontSizes.map((size) => (
            <DropdownMenuItem
              key={size.value}
              onClick={() => updateFontSize(size.value)}
              className={cn("flex items-center justify-between cursor-pointer",
                fontSize === size.value && "bg-accent"
              )}
            >
              <span>{size.label}</span>
              {fontSize === size.value && <div className="w-2 h-2 bg-primary rounded-full" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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