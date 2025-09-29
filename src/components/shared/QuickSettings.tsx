import React from 'react';
import { Settings, Moon, Sun, User, LogOut, Plus, Minus, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDisplaySettings, FontSize } from '@/hooks/useDisplaySettings';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const { fontSize, theme, updateFontSize, toggleTheme, setTheme } = useDisplaySettings(user?.id);

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'صغير' },
    { value: 'medium', label: 'متوسط' },
    { value: 'large', label: 'كبير' },
    { value: 'extra-large', label: 'كبير جداً' }
  ];

  const getCurrentFontLabel = () => {
    return fontSizes.find(f => f.value === fontSize)?.label || 'متوسط';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full border-2 border-border/40 bg-background/80 backdrop-blur-sm hover:bg-background/90 hover:border-border/60 dark:bg-slate-900/80 dark:hover:bg-slate-900/90 dark:border-slate-700/40 dark:hover:border-slate-600/60 transition-all duration-300",
            className
          )}
        >
          <Settings className="h-4 w-4 text-foreground/70 dark:text-slate-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-background/95 dark:bg-slate-900/95 backdrop-blur-sm border-border/40 dark:border-slate-700/40 shadow-lg transition-colors duration-300"
      >
        <DropdownMenuLabel className="text-foreground/80 dark:text-slate-200">الإعدادات</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40 dark:bg-slate-700/40" />
        
        {/* Theme Selection */}
        <DropdownMenuLabel className="text-sm text-muted-foreground dark:text-slate-400">الوضع</DropdownMenuLabel>
        <div className="flex flex-col space-y-1 px-2 py-1">
          <DropdownMenuItem 
            className="flex items-center justify-between hover:bg-background/80 dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 transition-colors duration-300" 
            onClick={() => setTheme('light')}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>فاتح</span>
            </div>
            {theme === 'light' && <div className="w-2 h-2 bg-primary rounded-full" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center justify-between hover:bg-background/80 dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 transition-colors duration-300" 
            onClick={() => setTheme('dark')}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>داكن</span>
            </div>
            {theme === 'dark' && <div className="w-2 h-2 bg-primary rounded-full" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center justify-between hover:bg-background/80 dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 transition-colors duration-300" 
            onClick={() => setTheme('system')}
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>النظام</span>
            </div>
            {theme === 'system' && <div className="w-2 h-2 bg-primary rounded-full" />}
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="bg-border/40 dark:bg-slate-700/40" />
        
        {/* Font Size Selection */}
        <DropdownMenuLabel className="text-sm text-muted-foreground dark:text-slate-400">حجم الخط</DropdownMenuLabel>
        <div className="flex flex-col space-y-1 px-2 py-1">
          {fontSizes.map((size) => (
            <DropdownMenuItem 
              key={size.value}
              className="flex items-center justify-between hover:bg-background/80 dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 transition-colors duration-300" 
              onClick={() => updateFontSize(size.value)}
            >
              <span>{size.label}</span>
              {fontSize === size.value && <div className="w-2 h-2 bg-primary rounded-full" />}
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator className="bg-border/40 dark:bg-slate-700/40" />
        
        {/* Action Buttons */}
        {onProfileClick && (
          <DropdownMenuItem 
            className="hover:bg-background/80 dark:hover:bg-slate-800/80 text-foreground dark:text-slate-200 transition-colors duration-300" 
            onClick={onProfileClick}
          >
            <User className="mr-2 h-4 w-4" />
            <span>البروفيل</span>
          </DropdownMenuItem>
        )}
        
        {onLogout && (
          <DropdownMenuItem 
            className="hover:bg-destructive/10 dark:hover:bg-red-900/20 text-destructive dark:text-red-400 transition-colors duration-300" 
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};