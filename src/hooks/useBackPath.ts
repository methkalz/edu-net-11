import { useAuth } from '@/hooks/useAuth';

export const useBackPath = () => {
  const { userProfile } = useAuth();
  
  // تحديد المسار المناسب للعودة حسب دور المستخدم
  const getContentBackPath = (): string => {
    if (userProfile?.role === 'superadmin') {
      return '/content-management';
    }
    return '/educational-content';
  };

  return {
    contentBackPath: getContentBackPath(),
    dashboardPath: '/dashboard'
  };
};