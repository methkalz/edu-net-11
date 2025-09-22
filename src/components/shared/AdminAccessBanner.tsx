import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
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
  
  // Only show if this is a PIN-based admin access session
  if (!adminAccess || !pinLogin) {
    return null;
  }

  const handleReturnToSuperAdmin = () => {
    if (onReturnToSuperAdmin) {
      onReturnToSuperAdmin();
    } else {
      window.location.href = '/super-admin-auth';
    }
  };

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              جلسة وصول إداري مؤقتة
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              تم تسجيل الدخول عبر PIN من لوحة السوبر آدمن
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToSuperAdmin}
          className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للسوبر آدمن
        </Button>
      </CardContent>
    </Card>
  );
};