import React from 'react';
import AppHeader from '@/components/shared/AppHeader';
import { DisplaySettings } from '@/components/shared/DisplaySettings';

const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AppHeader 
        title="الإعدادات" 
        showBackButton={true} 
        backPath="/dashboard" 
        showLogout={true} 
      />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <DisplaySettings />
        </div>
      </div>
    </div>
  );
};

export default Settings;