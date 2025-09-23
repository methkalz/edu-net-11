import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAudit } from '@/lib/audit/hooks/use-audit';

interface DirectImpersonationButtonProps {
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
}

export const DirectImpersonationButton: React.FC<DirectImpersonationButtonProps> = ({
  targetUserId,
  targetUserName,
  targetUserEmail
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { logSecurityEvent } = useAudit();

  const handleDirectImpersonation = async () => {
    if (!user) {
      toast.error('غير مسموح بهذا الإجراء');
      return;
    }

    setIsLoading(true);

    try {
      // Call the impersonate-user function
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: {
          targetUserId,
          adminUserId: user.id
        }
      });

      if (error) {
        console.error('Impersonation error:', error);
        toast.error('فشل في الدخول للحساب');
        return;
      }

      if (data?.success && data?.magicLink) {
        // Log the impersonation attempt
        await logSecurityEvent('USER_IMPERSONATION_STARTED', {
          target_user_id: targetUserId,
          target_user_name: targetUserName,
          target_user_email: targetUserEmail,
          admin_user_id: user.id
        });

        toast.success(`جاري تسجيل الدخول لحساب ${targetUserName}...`);
        
        // Redirect to the magic link
        window.location.href = data.magicLink;
      } else {
        toast.error('فشل في إنشاء رابط تسجيل الدخول');
      }
    } catch (error) {
      console.error('Direct impersonation error:', error);
      toast.error('حدث خطأ أثناء محاولة تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDirectImpersonation}
      disabled={isLoading}
      className="h-8 w-8 p-0 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
      title={`تسجيل دخول مباشر لحساب ${targetUserName}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
    </Button>
  );
};