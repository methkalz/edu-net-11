import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useLastLogin = () => {
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchLastLogin = async () => {
      if (!user?.id || !userProfile) return;

      setLoading(true);
      try {
        // For now, we'll use the user's last sign-in time from the auth user metadata
        // This is available from the user object directly
        if (user.last_sign_in_at) {
          setLastLogin(user.last_sign_in_at);
        } else {
          // Fallback to account creation date
          setLastLogin(user.created_at || null);
        }
      } catch (error) {
        console.error('Error in fetchLastLogin:', error);
        setLastLogin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLastLogin();
  }, [user?.id, user?.last_sign_in_at, user?.created_at, userProfile]);

  return { lastLogin, loading };
};