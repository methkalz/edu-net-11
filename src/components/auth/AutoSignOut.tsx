import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Component that automatically signs out the current user when mounted
 * Used for administrative session termination
 */
export const AutoSignOut = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    const performSignOut = async () => {
      await signOut();
    };
    
    performSignOut();
  }, [signOut]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">جاري إنهاء الجلسة...</p>
      </div>
    </div>
  );
};