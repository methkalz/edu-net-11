import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const AdminAccessBanner: React.FC = () => {
  const { signOut } = useAuth();
  
  // Check if this is an admin access session
  const isAdminAccess = new URLSearchParams(window.location.search).get('admin_access') === 'true';
  
  if (!isAdminAccess) return null;

  const handleReturnToAdmin = async () => {
    // Sign out and return to admin login
    await signOut();
    window.location.href = '/auth';
  };

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">
            أنت تتصفح كمستخدم آخر - وضع المراجعة الإدارية نشط
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleReturnToAdmin}
          className="flex items-center gap-1"
        >
          <LogOut className="h-3 w-3" />
          العودة للحساب الأصلي
        </Button>
      </AlertDescription>
    </Alert>
  );
};