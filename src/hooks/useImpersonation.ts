import { useState, useEffect } from 'react';
import { SecureStorage } from '@/lib/security/encryption';
import { SecurityMonitor } from '@/lib/security/security-monitor';
import { toast } from 'sonner';

interface ImpersonationData {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  return_url?: string;
}

interface ImpersonatedUser {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  school_id?: string;
  avatar_url?: string;
  display_title?: string;
  points?: number;
  level?: number;
}

export const useImpersonation = () => {
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<ImpersonationData | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  useEffect(() => {
    try {
      // فحص أمني: التحقق من وجود بيانات الانتحال
      const impersonatingStatus = localStorage.getItem('is_impersonating') === 'true';
      
      if (impersonatingStatus) {
        // استرجاع آمن للبيانات المشفرة
        const storedAdminData = SecureStorage.getSecureItem('admin_impersonation_data');
        const storedUserData = SecureStorage.getSecureItem('impersonated_user_data');

        if (storedAdminData && storedUserData) {
          // فحص أمني إضافي: التحقق من صحة البيانات
          if (storedAdminData.role !== 'superadmin') {
            SecurityMonitor.logSecurityEvent({
              type: 'UNAUTHORIZED_ACCESS',
              severity: 'CRITICAL',
              message: 'محاولة انتحال بدون صلاحيات سوبر آدمن',
              userId: storedAdminData.user_id,
              details: { attemptedRole: storedAdminData.role }
            });
            
            // مسح البيانات المشبوهة
            SecureStorage.clearAllSecureData();
            toast.error('تم اكتشاف نشاط مشبوه وتم إلغاء الجلسة');
            return;
          }

          setIsImpersonating(true);
          setAdminData(storedAdminData);
          setImpersonatedUser(storedUserData);
        } else {
          // البيانات تالفة أو منتهية الصلاحية
          setIsImpersonating(false);
          setAdminData(null);
          setImpersonatedUser(null);
          localStorage.removeItem('is_impersonating');
        }
      } else {
        setIsImpersonating(false);
        setAdminData(null);
        setImpersonatedUser(null);
      }
    } catch (error) {
      // في حالة فشل التشفير أو تلف البيانات
      SecurityMonitor.logSecurityEvent({
        type: 'DATA_TAMPERING',
        severity: 'HIGH',
        message: 'فشل في قراءة بيانات الانتحال المشفرة',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      // مسح البيانات التالفة
      SecureStorage.clearAllSecureData();
      setIsImpersonating(false);
      setAdminData(null);
      setImpersonatedUser(null);
      
      toast.error('تم اكتشاف تلف في البيانات وتم إعادة تعيين الجلسة');
    }
  }, []);

  const getEffectiveUser = () => {
    if (isImpersonating && impersonatedUser) {
      return {
        id: impersonatedUser.user_id,
        email: impersonatedUser.email,
        user_metadata: {
          full_name: impersonatedUser.full_name,
          email: impersonatedUser.email
        }
      };
    }
    return null;
  };

  const getEffectiveUserProfile = () => {
    if (isImpersonating && impersonatedUser) {
      return {
        user_id: impersonatedUser.user_id,
        full_name: impersonatedUser.full_name,
        email: impersonatedUser.email,
        role: impersonatedUser.role as 'superadmin' | 'school_admin' | 'teacher' | 'student' | 'parent',
        school_id: impersonatedUser.school_id,
        avatar_url: impersonatedUser.avatar_url,
        display_title: impersonatedUser.display_title,
        points: impersonatedUser.points,
        level: impersonatedUser.level,
        is_primary_admin: false,
        created_at: '',
        updated_at: '',
        phone: null,
        theme: 'light',
        font_size: 'medium'
      };
    }
    return null;
  };

  const stopImpersonation = () => {
    try {
      // تسجيل انتهاء جلسة الانتحال
      if (adminData && impersonatedUser) {
        SecurityMonitor.logSecurityEvent({
          type: 'IMPERSONATION_ATTEMPT',
          severity: 'MEDIUM',
          message: 'انتهاء جلسة انتحال بشكل طبيعي',
          userId: adminData.user_id,
          details: {
            impersonatedUserId: impersonatedUser.user_id,
            impersonatedUserName: impersonatedUser.full_name,
            action: 'stop_impersonation'
          }
        });
      }

      // مسح آمن لجميع البيانات
      SecureStorage.clearAllSecureData();
      setIsImpersonating(false);
      setAdminData(null);
      setImpersonatedUser(null);
      
      toast.success('تم العودة إلى الحساب الإداري بنجاح');
    } catch (error) {
      console.error('Error stopping impersonation:', error);
      // في حالة الفشل، مسح قسري للبيانات
      localStorage.clear();
      window.location.reload();
    }
  };

  return {
    isImpersonating,
    adminData,
    impersonatedUser,
    getEffectiveUser,
    getEffectiveUserProfile,
    stopImpersonation
  };
};