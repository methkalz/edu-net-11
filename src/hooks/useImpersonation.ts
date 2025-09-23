import { useState, useEffect } from 'react';

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
    // Check if currently impersonating
    const impersonatingStatus = localStorage.getItem('is_impersonating') === 'true';
    const storedAdminData = localStorage.getItem('admin_impersonation_data');
    const storedUserData = localStorage.getItem('impersonated_user_data');

    if (impersonatingStatus && storedAdminData && storedUserData) {
      setIsImpersonating(true);
      setAdminData(JSON.parse(storedAdminData));
      setImpersonatedUser(JSON.parse(storedUserData));
    } else {
      setIsImpersonating(false);
      setAdminData(null);
      setImpersonatedUser(null);
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
        phone: null
      };
    }
    return null;
  };

  const stopImpersonation = () => {
    localStorage.removeItem('is_impersonating');
    localStorage.removeItem('admin_impersonation_data');
    localStorage.removeItem('impersonated_user_data');
    setIsImpersonating(false);
    setAdminData(null);
    setImpersonatedUser(null);
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