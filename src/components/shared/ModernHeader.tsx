import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Bell, RefreshCw, Settings, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BackButton from './BackButton';
import { UniversalAvatar } from './UniversalAvatar';
import { UserTitleBadge } from './UserTitleBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ModernHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

interface HeaderSettings {
  logo_url: string;
  logo_size: 'small' | 'medium' | 'large';
  title_text: string;
  title_color: string;
  title_size: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  show_logo: boolean;
  show_title: boolean;
  background_color: string;
  text_color: string;
  background_opacity: number;
  blur_intensity: number;
  enable_glass_effect: boolean;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  title, 
  showBackButton = false, 
  backPath = '/dashboard',
  onRefresh,
  refreshing = false,
  notificationCount = 0,
  onNotificationClick
}) => {
  const navigate = useNavigate();
  const { signOut, userProfile, user } = useAuth();
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>({
    logo_url: '/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png',
    logo_size: 'medium',
    title_text: 'نظام إدارة المدارس',
    title_color: '#2563eb',
    title_size: '2xl',
    show_logo: true,
    show_title: true,
    background_color: '#ffffff',
    text_color: '#1f2937',
    background_opacity: 0.95,
    blur_intensity: 10,
    enable_glass_effect: true
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('header_settings');
    if (savedSettings) {
      setHeaderSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const getLogoSize = () => {
    switch (headerSettings.logo_size) {
      case 'small': return 'h-8 w-auto';
      case 'medium': return 'h-12 w-auto';
      case 'large': return 'h-16 w-auto';
      default: return 'h-12 w-auto';
    }
  };

  const getTitleSize = () => {
    return `text-${headerSettings.title_size}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  };

  const getCurrentTime = () => {
    return format(new Date(), 'EEEE، dd MMMM yyyy', { locale: ar });
  };

  return (
    <header 
      className={`sticky top-0 z-50 border-0 shadow-xl ${
        headerSettings.enable_glass_effect ? 'glass-card' : 'bg-background'
      }`}
      style={{ 
        backgroundColor: !headerSettings.enable_glass_effect 
          ? headerSettings.background_color 
          : undefined
      }}
    >
      {/* Elegant gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-background/50 to-secondary/8 -z-10"></div>
      
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left Section: Back Button + Logo + Title */}
          <div className="flex items-center gap-6">
            {showBackButton && (
              <BackButton backPath={backPath} />
            )}
            
            <div className="flex items-center gap-4">
              {headerSettings.show_logo && (
                <img 
                  src={headerSettings.logo_url} 
                  alt="شعار النظام" 
                  className={`${getLogoSize()} shadow-sm rounded-lg hover:scale-105 transition-transform duration-300`}
                />
              )}
              {headerSettings.show_title && (
                <div className="space-y-1">
                  <h1 
                    className={`font-bold font-cairo ${getTitleSize()} bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent`}
                  >
                    {title || headerSettings.title_text}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="hidden md:block">{getCurrentTime()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Section: User Welcome & Avatar */}
          {user && userProfile && (
            <div className="hidden lg:flex items-center gap-8 relative">
              {/* Greeting */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground font-medium">{getGreeting()}</p>
                <h2 className="text-xl font-bold text-foreground">
                  {userProfile.full_name || user.email}
                </h2>
                <UserTitleBadge
                  role={userProfile.role}
                  displayTitle={userProfile.display_title}
                  points={userProfile.points}
                  level={userProfile.level}
                  size="sm"
                  variant="secondary"
                />
              </div>
              
              {/* Profile Avatar - Enhanced overlapping design */}
              <div className="relative">
                {/* Avatar container with overlapping effect */}
                <div className="relative -mb-8 bg-background/90 backdrop-blur-md rounded-full p-3 shadow-2xl border border-border/20">
                  <UniversalAvatar
                    avatarUrl={userProfile.avatar_url}
                    userName={userProfile.full_name}
                    size="xl"
                    className="shadow-xl hover:scale-105 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="glass-card hover:shadow-lg transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:bg-primary/5"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline mr-2">
                  {refreshing ? 'جاري التحديث...' : 'تحديث'}
                </span>
              </Button>
            )}

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onNotificationClick}
              className="glass-card hover:shadow-lg transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:bg-secondary/5 relative"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-gradient-to-r from-destructive to-destructive/80 text-white rounded-full flex items-center justify-center animate-pulse"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
              <span className="hidden md:inline mr-2">الإشعارات</span>
            </Button>

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/settings')}
              className="hover:bg-muted/50 transition-all duration-300 opacity-70 hover:opacity-100"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="glass-card hover:shadow-lg transition-all duration-300 border border-destructive/10 hover:border-destructive/30 hover:bg-destructive/5 text-destructive/80 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline mr-2">خروج</span>
            </Button>
          </div>
        </div>

        {/* Mobile User Info - Enhanced for smaller screens */}
        {user && userProfile && (
          <div className="lg:hidden mt-6 pt-4 border-t border-border/30">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur"></div>
                <UniversalAvatar
                  avatarUrl={userProfile.avatar_url}
                  userName={userProfile.full_name}
                  size="lg"
                  className="border-2 border-primary/20 shadow-lg"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">{getGreeting()}</p>
                <h2 className="text-lg font-bold text-foreground">
                  {userProfile.full_name || user.email}
                </h2>
                <UserTitleBadge
                  role={userProfile.role}
                  displayTitle={userProfile.display_title}
                  points={userProfile.points}
                  level={userProfile.level}
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ModernHeader;