import React from 'react';
import { Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBackPath } from '@/hooks/useBackPath';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import Grade10Content from '@/components/content/Grade10Content';
import Grade10ContentViewer from '@/components/content/Grade10ContentViewer';
const Grade10Management: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const { contentBackPath } = useBackPath();
  
  // التأكد من أن المستخدم مسجل دخول ولديه profile
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">يجب تسجيل الدخول</h2>
          <p className="text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
          <Button onClick={() => window.location.href = '/auth'}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }
  
  // تحديد ما إذا كان المستخدم سوبر آدمن فقط
  const canManageContent = userProfile?.role === 'superadmin';
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader title="إدارة محتوى الصف العاشر" showBackButton={true} backPath={contentBackPath} showLogout={true} />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-blue-100 text-blue-700 px-6 py-3 rounded-full">
              <Video className="h-6 w-6" />
              <span className="font-semibold">الصف العاشر</span>
            </div>
            
            
          </div>
          
          <div className="animate-fade-in">
            {canManageContent ? <Grade10Content /> : <Grade10ContentViewer />}
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>;
};
export default Grade10Management;