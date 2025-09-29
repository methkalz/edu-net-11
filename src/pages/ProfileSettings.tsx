import React from 'react';
import { UserProfileSettings } from '@/components/shared/UserProfileSettings';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/hooks/useAuth';

const ProfileSettings: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 dark:from-slate-950 dark:to-slate-900/50 transition-colors duration-300">
      <AppHeader 
        title="إعدادات البروفيل" 
        showBackButton={true} 
        backPath="/dashboard" 
        showLogout={true} 
      />
      
      <div className="container mx-auto px-6 py-8">
        <UserProfileSettings />
      </div>
    </div>
  );
};

export default ProfileSettings;