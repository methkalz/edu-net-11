import React from 'react';
import { Settings, Moon, Sun, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useDisplaySettings } from '@/hooks/useDisplaySettings';
import { FontSizeControl } from '@/components/shared/FontSizeControl';

interface QuickSettingsProps {
  onProfileClick?: () => void;
  onLogout?: () => void;
  className?: string;
  showFontControl?: boolean;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  onProfileClick,
  onLogout,
  className,
  showFontControl = true
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDisplaySettings();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Font Size Control */}
      {showFontControl && (
        <div className="hidden lg:block">
          <FontSizeControl />
        </div>
      )}

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="opacity-70 hover:opacity-100 transition-opacity"
        title={theme === 'dark' ? "الوضع المضيء" : "الوضع المظلم"}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSettingsClick}
        className="opacity-70 hover:opacity-100 transition-opacity"
        title="الإعدادات"
      >
        <Settings className="h-4 w-4" />
      </Button>

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