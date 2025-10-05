import React from 'react';
import { UserProfileSettings } from '@/components/shared/UserProfileSettings';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { ZohoWriterConnect } from '@/components/zoho/ZohoWriterConnect';

const ProfileSettings: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AppHeader 
        title="إعدادات البروفيل" 
        showBackButton={true} 
        backPath="/dashboard" 
        showLogout={true} 
      />
      
      <div className="container mx-auto px-6 py-8 space-y-6">
        <UserProfileSettings />
        
        {/* Zoho Writer Integration */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">التكامل مع Zoho Writer</h2>
          <ZohoWriterConnect />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;