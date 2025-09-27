/**
 * Enhanced Logout Button Component
 * 
 * زر تسجيل خروج محسن مع حماية من الضغط المتكرر
 * ومعالجة شاملة للأخطاء
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutManager } from '@/hooks/useLogoutManager';
import { toast } from '@/hooks/use-toast';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children,
  className = ''
}) => {
  const { signOut } = useAuth();
  const { 
    isLoggingOut, 
    logoutAttempts, 
    shouldPreventLogout,
    safeLogout 
  } = useLogoutManager();

  const handleLogout = async () => {
    if (shouldPreventLogout()) {
      toast({
        title: "انتظر قليلاً",
        description: "جاري معالجة طلب تسجيل الخروج السابق",
        variant: "destructive"
      });
      return;
    }

    if (logoutAttempts >= 3) {
      // استخدام الطريقة الآمنة للتسجيل
      const success = await safeLogout();
      if (success) {
        window.location.href = '/auth';
      }
    } else {
      // استخدام الطريقة العادية
      await signOut();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${className} ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoggingOut ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          جاري تسجيل الخروج...
        </>
      ) : (
        <>
          {showIcon && (
            logoutAttempts >= 2 ? 
              <AlertTriangle className="h-4 w-4 mr-2" /> : 
              <LogOut className="h-4 w-4 mr-2" />
          )}
          {children || 'تسجيل الخروج'}
        </>
      )}
    </Button>
  );
};