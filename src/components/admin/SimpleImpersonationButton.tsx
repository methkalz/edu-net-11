import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SecureStorage } from '@/lib/security/encryption';
import { SecurityMonitor } from '@/lib/security/security-monitor';
import { RateLimiter } from '@/lib/security/rate-limiter';

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
      // 1. فحص أمني أولي: التحقق من صلاحيات السوبر آدمن
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminProfile || adminProfile.role !== 'superadmin') {
        SecurityMonitor.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'CRITICAL',
          message: 'محاولة انتحال من غير سوبر آدمن',
          userId: user.id,
          details: {
            targetUserId,
            targetUserName,
            attemptedRole: adminProfile?.role || 'unknown'
          }
        });

        toast.error('غير مسموح لك بهذا الإجراء');
        return;
      }

      // 2. فحص Rate Limiting
      const rateLimitKey = `impersonation_${user.id}`;
      if (!RateLimiter.isAllowed(rateLimitKey, 5, 60000)) { // 5 محاولات في الدقيقة
        const cooldownTime = RateLimiter.getCooldownTime(rateLimitKey);
        const remainingMinutes = Math.ceil(cooldownTime / 60000);
        
        SecurityMonitor.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          message: 'تجاوز الحد المسموح لمحاولات الانتحال',
          userId: user.id,
          details: { cooldownTime, targetUserId }
        });

        toast.error(`يرجى الانتظار ${remainingMinutes} دقيقة قبل المحاولة مرة أخرى`);
        return;
      }

      // 3. فحص النشاط المشبوه
      SecurityMonitor.checkSuspiciousActivity(user.id, 'impersonation_attempt', {
        targetUserId,
        targetUserName,
        targetUserRole
      });

      // 4. الحصول على بيانات المستخدم المستهدف
      const { data: targetUser, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error || !targetUser) {
        RateLimiter.recordFailedAttempt(rateLimitKey);
        toast.error('فشل في العثور على بيانات المستخدم');
        return;
      }

      // 5. فحص أمني: منع انتحال سوبر آدمن آخر
      if (targetUser.role === 'superadmin') {
        SecurityMonitor.logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'CRITICAL',
          message: 'محاولة انتحال سوبر آدمن',
          userId: user.id,
          details: { targetUserId, targetUserName }
        });

        toast.error('لا يمكن انتحال حساب سوبر آدمن');
        return;
      }

      // 6. حفظ بيانات الجلسة بطريقة آمنة
      const adminData = {
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Super Admin',
        role: 'superadmin',
        return_url: window.location.pathname
      };
      
      // استخدام التشفير الآمن
      SecureStorage.setSecureItem('admin_impersonation_data', adminData);
      SecureStorage.setSecureItem('impersonated_user_data', targetUser);
      localStorage.setItem('is_impersonating', 'true');

      // 7. تسجيل العملية الناجحة
      SecurityMonitor.logSecurityEvent({
        type: 'IMPERSONATION_ATTEMPT',
        severity: 'MEDIUM',
        message: 'بدء جلسة انتحال ناجحة',
        userId: user.id,
        details: {
          targetUserId,
          targetUserName,
          targetUserRole,
          action: 'start_impersonation'
        }
      });

      toast.success(`تم تسجيل الدخول كـ ${targetUserName}`);
      
      // التنقل مع المعاملات الآمنة
      navigate(`/dashboard?impersonated=true&user_id=${targetUserId}&admin_id=${user.id}`);
      
      // إعادة تحميل الصفحة لتطبيق الانتحال
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (error) {
      console.error('Simple impersonation error:', error);
      
      // تسجيل الخطأ كحدث أمني
      SecurityMonitor.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        message: 'فشل في عملية الانتحال',
        userId: user?.id,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          targetUserId,
          targetUserName
        }
      });

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
        <Shield className="h-4 w-4" />
      )}
    </Button>
  );
};