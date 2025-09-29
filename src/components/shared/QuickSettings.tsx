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
          className="w-48 bg-background/95 backdrop-blur-lg border border-border/50 shadow-xl rounded-xl p-1"
          style={{ zIndex: 50 }}
        >
          {/* Theme Section */}
          <div className="p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">الوضع المرئي</p>
            <div className="space-y-1">
              <DropdownMenuItem 
                onClick={() => setTheme('light')}
                className={cn(
                  "flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 transition-all duration-200",
                  "hover:bg-accent/50 focus:bg-accent/50",
                  theme === 'light' && "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">نهاري</span>
                </div>
                {theme === 'light' && <div className="w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 transition-all duration-200",
                  "hover:bg-accent/50 focus:bg-accent/50",
                  theme === 'dark' && "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">ليلي</span>
                </div>
                {theme === 'dark' && <div className="w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setTheme('system')}
                className={cn(
                  "flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 transition-all duration-200",
                  "hover:bg-accent/50 focus:bg-accent/50",
                  theme === 'system' && "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">تلقائي</span>
                </div>
                {theme === 'system' && <div className="w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-border/30 mx-2 my-2" />
          
          {/* Font Size Section */}
          <div className="p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">حجم الخط</p>
            <div className="space-y-1">
              {fontSizes.map((size) => (
                <DropdownMenuItem
                  key={size.value}
                  onClick={() => updateFontSize(size.value)}
                  className={cn(
                    "flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 transition-all duration-200",
                    "hover:bg-accent/50 focus:bg-accent/50",
                    fontSize === size.value && "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  <span className="text-sm">{size.label}</span>
                  {fontSize === size.value && <div className="w-2 h-2 bg-primary rounded-full" />}
                </DropdownMenuItem>
              ))}
            </div>
          </div>
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