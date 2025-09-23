import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SimpleImpersonationButtonProps {
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  targetUserRole: string;
}

export const SimpleImpersonationButton: React.FC<SimpleImpersonationButtonProps> = ({
  targetUserId,
  targetUserName,
  targetUserEmail,
  targetUserRole
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSimpleImpersonation = async () => {
    if (!user) {
      toast.error('غير مسموح بهذا الإجراء');
      return;
    }

    setIsLoading(true);

    try {
      // Get full target user data
      const { data: targetUser, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error || !targetUser) {
        toast.error('فشل في العثور على بيانات المستخدم');
        return;
      }

      // Save current admin session info
      const adminData = {
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Super Admin',
        role: 'superadmin',
        return_url: window.location.pathname
      };
      
      localStorage.setItem('admin_impersonation_data', JSON.stringify(adminData));
      localStorage.setItem('impersonated_user_data', JSON.stringify(targetUser));
      localStorage.setItem('is_impersonating', 'true');

      toast.success(`تم تسجيل الدخول كـ ${targetUserName}`);
      
      // Navigate to dashboard with impersonation parameters
      navigate(`/dashboard?impersonated=true&user_id=${targetUserId}&admin_id=${user.id}`);
      
      // Refresh the page to apply impersonation
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (error) {
      console.error('Simple impersonation error:', error);
      toast.error('حدث خطأ أثناء محاولة تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSimpleImpersonation}
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