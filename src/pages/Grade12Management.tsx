import React from 'react';
import { BookOpen, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBackPath } from '@/hooks/useBackPath';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import Grade12Content from '@/components/content/Grade12Content';
import Grade12ContentViewer from '@/components/content/Grade12ContentViewer';
const Grade12Management: React.FC = () => {
  const { userProfile } = useAuth();
  const { contentBackPath } = useBackPath();
  
  // تحديد ما إذا كان المستخدم سوبر آدمن فقط
  const canManageContent = userProfile?.role === 'superadmin';
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader title="إدارة محتوى الصف الثاني عشر" showBackButton={true} backPath={contentBackPath} showLogout={true} />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-purple-100 text-purple-700 px-6 py-3 rounded-full">
              <Trophy className="h-6 w-6" />
              <span className="font-semibold">الصف الثاني عشر</span>
            </div>
            
            
          </div>
          
          <div className="animate-fade-in">
            {canManageContent ? <Grade12Content /> : <Grade12ContentViewer />}
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>;
};
export default Grade12Management;