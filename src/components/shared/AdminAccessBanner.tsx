import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowLeft, User } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface AdminAccessBannerProps {
  onReturnToSuperAdmin?: () => void;
}

export const AdminAccessBanner: React.FC<AdminAccessBannerProps> = ({ 
  onReturnToSuperAdmin 
}) => {
  const [searchParams] = useSearchParams();
  const adminAccess = searchParams.get('admin_access');
  const pinLogin = searchParams.get('pin_login');
  const impersonated = searchParams.get('impersonated');
  
  // Show if admin access or impersonation is active
  if (!adminAccess && !impersonated) {
    return null;
  }

  const handleReturnToSuperAdmin = () => {
    // Clear impersonation data
    localStorage.removeItem('impersonation_session');
    localStorage.removeItem('original_admin_session');
    
    if (onReturnToSuperAdmin) {
      onReturnToSuperAdmin();
    } else {
      window.location.href = '/users';
    }
  };

  const isImpersonation = impersonated === 'true';

  return (
    <Card className={`mb-4 ${isImpersonation 
      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
      : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
    }`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {isImpersonation ? (
            <User className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <p className={`font-medium ${isImpersonation 
              ? 'text-red-800 dark:text-red-200' 
              : 'text-amber-800 dark:text-amber-200'
            }`}>
              {isImpersonation ? 'جلسة انتحال هوية نشطة' : 'جلسة وصول إداري مؤقتة'}
            </p>
            <p className={`text-sm ${isImpersonation 
              ? 'text-red-700 dark:text-red-300' 
              : 'text-amber-700 dark:text-amber-300'
            }`}>
              {isImpersonation 
                ? 'تم الدخول بصلاحيات مستخدم آخر عبر نظام PIN' 
                : 'تم تسجيل الدخول عبر PIN من لوحة السوبر آدمن'
              }
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToSuperAdmin}
          className={isImpersonation 
            ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900'
            : 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900'
          }
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للسوبر آدمن
        </Button>
      </CardContent>
    </Card>
  );
};