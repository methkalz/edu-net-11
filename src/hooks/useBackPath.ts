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

  // تحديد المسار المناسب للعودة من الألعاب
  const getGameBackPath = (): string => {
    const role = userProfile?.role;
    
    // الطلاب يعودون إلى المحتوى التعليمي
    if (role === 'student') {
      return '/educational-content';
    }
    
    // المعلمين ومدراء المدارس والمدراء العامين يعودون إلى إدارة الصف 11
    if (role === 'teacher' || role === 'school_admin' || role === 'superadmin') {
      return '/grade11-management';
    }
    
    // افتراضي للحالات الأخرى
    return '/dashboard';
  };

  return {
    contentBackPath: getContentBackPath(),
    gameBackPath: getGameBackPath(),
    dashboardPath: '/dashboard'
  };
};