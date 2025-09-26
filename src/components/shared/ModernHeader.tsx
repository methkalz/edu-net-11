import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BackButton from './BackButton';
import { NotificationCenter } from './NotificationCenter';
import { UserProfileSection } from './UserProfileSection';
import { QuickSettings } from './QuickSettings';

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

  return (
    <header 
      className={`sticky top-0 z-50 border-0 shadow-lg ${
        headerSettings.enable_glass_effect 
          ? 'bg-background/95 backdrop-blur-md' 
          : 'bg-background'
      }`}
      style={{ 
        backgroundColor: !headerSettings.enable_glass_effect 
          ? headerSettings.background_color 
          : undefined
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background/50 to-secondary/5 -z-10"></div>
      
      <div className="container mx-auto px-6 py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-6">
          
          {/* Left Section: Back Button + Brand */}
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
                  {user && userProfile && (
                    <div className="flex items-center gap-2 text-base text-foreground font-bold">
                      <span>{getGreeting()}, {userProfile.full_name || user.email}</span>
                    </div>
                  )}
                  <h1 
                    className={`font-cairo ${getTitleSize()} text-muted-foreground`}
                  >
                    {title || headerSettings.title_text}
                  </h1>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: User Profile + Actions */}
          <div className="flex items-center gap-4">
            {user && userProfile && (
              <UserProfileSection
                avatarUrl={userProfile.avatar_url}
                userName={userProfile.full_name}
                userEmail={user.email}
                role={userProfile.role}
                displayTitle={userProfile.display_title}
                points={userProfile.points}
                level={userProfile.level}
                greeting={getGreeting()}
                variant="desktop"
              />
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              {/* Refresh Button */}
              {onRefresh && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden xl:inline mr-2">
                    {refreshing ? 'جاري التحديث...' : 'تحديث'}
                  </span>
                </Button>
              )}

              {/* Notifications */}
              <NotificationCenter
                notificationCount={notificationCount}
                onNotificationClick={onNotificationClick}
                hasUrgent={notificationCount > 5}
              />

              {/* Quick Settings */}
              <QuickSettings
                onSettingsClick={() => navigate('/settings')}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          {/* Top Row: Back Button + Brand + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <BackButton backPath={backPath} />
              )}
              
              {headerSettings.show_logo && (
                <img 
                  src={headerSettings.logo_url} 
                  alt="شعار النظام" 
                  className="h-10 w-auto"
                />
              )}
              
              {headerSettings.show_title && (
                <h1 className="text-lg font-bold text-foreground">
                  {title || headerSettings.title_text}
                </h1>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
              
              <NotificationCenter
                notificationCount={notificationCount}
                onNotificationClick={onNotificationClick}
                hasUrgent={notificationCount > 5}
              />
              
              <QuickSettings
                onLogout={handleLogout}
                onSettingsClick={() => navigate('/settings')}
              />
            </div>
          </div>

          {/* Search Bar */}
          {/* User Profile Section */}
          {user && userProfile && (
            <div className="pt-2 border-t border-border/20">
              <UserProfileSection
                avatarUrl={userProfile.avatar_url}
                userName={userProfile.full_name}
                userEmail={user.email}
                role={userProfile.role}
                displayTitle={userProfile.display_title}
                points={userProfile.points}
                level={userProfile.level}
                greeting={getGreeting()}
                variant="mobile"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;