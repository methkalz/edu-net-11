import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';  
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User } from 'lucide-react';

interface AdminAccessBannerProps {
  onReturnToSuperAdmin?: () => void;
}

export const AdminAccessBanner: React.FC<AdminAccessBannerProps> = ({ onReturnToSuperAdmin }) => {
  // Check URL parameters for different access types
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminAccess = urlParams.get('admin_access') === 'true';
  const isImpersonated = urlParams.get('impersonated') === 'true';
  const isPinLogin = urlParams.get('pin_login') === 'true';
  
  // Don't show banner if none of the admin access flags are present
  if (!isAdminAccess && !isImpersonated && !isPinLogin) return null;

  const handleReturnToSuperAdmin = () => {
    // Clear any impersonation data
    localStorage.removeItem('impersonation_data');
    localStorage.removeItem('pin_session_data');
    localStorage.removeItem('impersonation_session');
    localStorage.removeItem('original_admin_session');
    
    if (onReturnToSuperAdmin) {
      onReturnToSuperAdmin();
    } else {
      // Navigate back to users page
      window.location.href = '/users';
    }
  };

  // Determine banner content based on access type
  const getBannerContent = () => {
    if (isPinLogin) {
      return {
        variant: 'default' as const,
        icon: Shield,
        message: 'تم تسجيل الدخول باستخدام PIN إداري مؤقت',
        buttonText: 'إنهاء الجلسة'
      };
    } else if (isImpersonated) {
      return {
        variant: 'destructive' as const,
        icon: User,
        message: 'أنت تتصفح كمستخدم آخر - وضع المحاكاة نشط',
        buttonText: 'إنهاء المحاكاة'
      };
    } else {
      return {
        variant: 'default' as const,
        icon: Shield,
        message: 'وضع الوصول الإداري نشط',
        buttonText: 'العودة للحساب الأصلي'
      };
    }
  };

  const bannerContent = getBannerContent();
  const IconComponent = bannerContent.icon;

  return (
    <Alert className={`mb-4 ${
      bannerContent.variant === 'destructive' 
        ? 'border-destructive bg-destructive/10' 
        : 'border-warning bg-warning/10'
    }`}>
      <IconComponent className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {bannerContent.message}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleReturnToSuperAdmin}
          className="flex items-center gap-1"
        >
          <LogOut className="h-3 w-3" />
          {bannerContent.buttonText}
        </Button>
      </AlertDescription>
    </Alert>
  );
};