import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  
  // Check if currently impersonating
  const isImpersonating = localStorage.getItem('is_impersonating') === 'true';
  const impersonatedUserData = localStorage.getItem('impersonated_user_data');
  const adminData = localStorage.getItem('admin_impersonation_data');
  
  if (!isImpersonating || !impersonatedUserData || !adminData) return null;

  const targetUser = JSON.parse(impersonatedUserData);
  const admin = JSON.parse(adminData);

  const handleReturnToAdmin = () => {
    // Clear impersonation data
    localStorage.removeItem('is_impersonating');
    localStorage.removeItem('impersonated_user_data');
    localStorage.removeItem('admin_impersonation_data');
    
    toast.success('تم العودة للحساب الأصلي');
    
    // Navigate back to user management
    navigate('/users');
    
    // Refresh to restore admin session
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">
            أنت تتصفح كـ {targetUser.full_name} - وضع المراجعة الإدارية نشط
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