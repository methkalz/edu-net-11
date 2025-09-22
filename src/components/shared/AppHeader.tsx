import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BackButton from './BackButton';
import { UniversalAvatar } from './UniversalAvatar';
import { UserTitleBadge } from './UserTitleBadge';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
  showLogout?: boolean;
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

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  showBackButton = false, 
  backPath = '/dashboard',
  showLogout = false 
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
    // جلب إعدادات الهيدر من التخزين المحلي
    const savedSettings = localStorage.getItem('header_settings');
    if (savedSettings) {
      setHeaderSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
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

  return (
    <header 
      className={`glass-card sticky top-0 z-50 soft-shadow ${
        headerSettings.enable_glass_effect ? 'backdrop-blur supports-[backdrop-filter]:bg-background/60' : ''
      }`}
      style={{ 
        backgroundColor: headerSettings.enable_glass_effect 
          ? `${headerSettings.background_color}${Math.round(headerSettings.background_opacity * 255).toString(16).padStart(2, '0')}`
          : headerSettings.background_color,
        backdropFilter: headerSettings.enable_glass_effect ? `blur(${headerSettings.blur_intensity}px)` : 'none'
      }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {showBackButton && (
              <BackButton backPath={backPath} />
            )}
            
            <div className="flex items-center gap-3">
              {headerSettings.show_logo && (
                <img 
                  src={headerSettings.logo_url} 
                  alt="شعار النظام" 
                  className={getLogoSize()}
                />
              )}
              {headerSettings.show_title && (
                <h1 
                  className={`font-bold font-cairo ${getTitleSize()}`}
                  style={{ color: headerSettings.title_color }}
                >
                  {title || headerSettings.title_text}
                </h1>
              )}
            </div>
          </div>

          {showLogout && (
            <div className="flex items-center gap-4">
              {user && userProfile && (
                <>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: headerSettings.text_color }}>
                      {userProfile.full_name || user.email}
                    </div>
                    <div className="text-xs">
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
                  
                  <UniversalAvatar
                    avatarUrl={userProfile.avatar_url}
                    userName={userProfile.full_name}
                    size="sm"
                    className="border-2 border-primary/20"
                  />
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="card-hover"
              >
                <LogOut className="h-4 w-4 ml-1" />
                تسجيل الخروج
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;