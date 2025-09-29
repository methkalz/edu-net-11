import React from 'react';
import { Settings, Moon, Sun, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FontSizeControl } from './FontSizeControl';
import { useDisplaySettings } from '@/hooks/useDisplaySettings';

interface QuickSettingsProps {
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  className?: string;
  showFontControl?: boolean;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  onSettingsClick,
  onProfileClick,
  onLogout,
  className,
  showFontControl = true
}) => {
  const { toggleTheme, isDarkMode } = useDisplaySettings();
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Font Size Control */}
      {showFontControl && (
        <FontSizeControl />
      )}

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="opacity-70 hover:opacity-100 transition-opacity"
        title={isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

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

      {/* General Settings */}
      {onSettingsClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="opacity-70 hover:opacity-100 transition-opacity"
          title="الإعدادات"
        >
          <Settings className="h-4 w-4" />
        </Button>
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