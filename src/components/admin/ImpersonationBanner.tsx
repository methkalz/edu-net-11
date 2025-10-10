import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ImpersonationBanner: React.FC = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    // Check URL for admin_access parameter
    const urlParams = new URLSearchParams(window.location.search);
    const adminAccess = urlParams.get('admin_access') === 'true';
    const adminId = urlParams.get('admin_id');
    
    if (adminAccess && adminId) {
      setShowBanner(true);
      setAdminUserId(adminId);
      // Save to localStorage for "Return to Admin" button
      localStorage.setItem('impersonation_admin_id', adminId);
    } else {
      // Check localStorage in case URL was cleared
      const savedAdminId = localStorage.getItem('impersonation_admin_id');
      if (savedAdminId) {
        setShowBanner(true);
        setAdminUserId(savedAdminId);
      }
    }
  }, []);

  const handleReturnToAdmin = async () => {
    if (!adminUserId) {
      toast.error('لا يمكن العودة للحساب الأصلي');
      return;
    }

    setIsReturning(true);

    try {
      // Call Edge Function to generate Magic Link for admin
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: {
          targetUserId: adminUserId,
          adminUserId: user?.id,
          returnToAdmin: true
        }
      });

      if (error || !data?.magicLink) {
        throw new Error('فشل في إنشاء رابط العودة');
      }

      // Clear impersonation data
      localStorage.removeItem('impersonation_admin_id');
      
      toast.success('جاري العودة للحساب الأصلي...');
      
      // Redirect to admin magic link
      window.location.href = data.magicLink;
    } catch (error: any) {
      console.error('Return to admin error:', error);
      toast.error(error.message || 'حدث خطأ أثناء العودة');
      setIsReturning(false);
    }
  };

  if (!showBanner) return null;

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">
            🔐 أنت تتصفح كمستخدم آخر - وضع المراجعة الإدارية نشط
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleReturnToAdmin}
          disabled={isReturning}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          {isReturning ? 'جاري العودة...' : 'العودة للحساب الأصلي'}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
