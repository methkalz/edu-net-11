import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SecureStorage } from '@/lib/security/encryption';
import { SecurityMonitor } from '@/lib/security/security-monitor';

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [impersonatedUserName, setImpersonatedUserName] = useState('');

  useEffect(() => {
    const impersonatingStatus = localStorage.getItem('is_impersonating') === 'true';
    
    if (impersonatingStatus) {
      try {
        // فحص أمني: استرجاع البيانات المشفرة
        const storedUserData = SecureStorage.getSecureItem('impersonated_user_data');
        const storedAdminData = SecureStorage.getSecureItem('admin_impersonation_data');
        
        if (storedUserData && storedAdminData) {
          // فحص أمني إضافي: التأكد من صحة البيانات
          if (storedAdminData.role !== 'superadmin') {
            SecurityMonitor.logSecurityEvent({
              type: 'UNAUTHORIZED_ACCESS',
              severity: 'CRITICAL',
              message: 'محاولة عرض شعار انتحال بدون صلاحيات',
              userId: storedAdminData.user_id,
              details: { role: storedAdminData.role }
            });
            
            // مسح البيانات المشبوهة
            SecureStorage.clearAllSecureData();
            toast.error('تم اكتشاف نشاط مشبوه');
            return;
          }

          // فحص URL parameters للتأكد من المطابقة
          const urlParams = new URLSearchParams(window.location.search);
          const urlAdminId = urlParams.get('admin_id');
          const urlUserId = urlParams.get('user_id');

          if (urlAdminId && !SecurityMonitor.validateUrlParameters(urlAdminId, storedAdminData.user_id)) {
            SecureStorage.clearAllSecureData();
            toast.error('تم اكتشاف تلاعب في رابط الصفحة');
            window.location.href = '/dashboard';
            return;
          }

          if (urlUserId && urlUserId !== storedUserData.user_id) {
            SecurityMonitor.logSecurityEvent({
              type: 'SUSPICIOUS_ACTIVITY',
              severity: 'HIGH',
              message: 'عدم تطابق معرف المستخدم في URL',
              userId: storedAdminData.user_id,
              details: { urlUserId, actualUserId: storedUserData.user_id }
            });
          }

          setImpersonatedUserName(storedUserData.full_name || 'مستخدم مجهول');
          setShowBanner(true);
        } else {
          // البيانات مفقودة أو تالفة
          localStorage.removeItem('is_impersonating');
          toast.error('انتهت صلاحية جلسة الانتحال');
        }
      } catch (error) {
        // فشل في فك التشفير أو تلف البيانات
        SecurityMonitor.logSecurityEvent({
          type: 'DATA_TAMPERING',
          severity: 'HIGH',
          message: 'فشل في قراءة بيانات الانتحال في الشعار',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });

        SecureStorage.clearAllSecureData();
        toast.error('تم اكتشاف تلف في البيانات');
        window.location.href = '/dashboard';
      }
    }
  }, []);

  const handleReturnToAdmin = () => {
    try {
      // تسجيل العودة الآمنة
      const adminData = SecureStorage.getSecureItem('admin_impersonation_data');
      const userData = SecureStorage.getSecureItem('impersonated_user_data');
      
      if (adminData && userData) {
        SecurityMonitor.logSecurityEvent({
          type: 'IMPERSONATION_ATTEMPT',
          severity: 'MEDIUM',
          message: 'انتهاء جلسة انتحال من الشعار',
          userId: adminData.user_id,
          details: {
            impersonatedUserId: userData.user_id,
            impersonatedUserName: userData.full_name,
            action: 'return_from_banner'
          }
        });
      }

      // مسح آمن للبيانات
      SecureStorage.clearAllSecureData();
      
      toast.success('تم العودة إلى الحساب الإداري');
      navigate('/user-management');
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error returning to admin:', error);
      // في حالة الفشل، مسح قسري
      localStorage.clear();
      window.location.href = '/user-management';
    }
  };

  if (!showBanner) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 shadow-md">
      <Shield className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-amber-800">
          أنت تعمل الآن كـ <strong>{impersonatedUserName}</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToAdmin}
          className="ml-2 h-7 px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
        >
          <ArrowLeft className="ml-1 h-3 w-3" />
          العودة للإدارة
        </Button>
      </AlertDescription>
    </Alert>
  );
};