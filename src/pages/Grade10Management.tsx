import React, { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBackPath } from '@/hooks/useBackPath';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import Grade10Content from '@/components/content/Grade10Content';
import Grade10ContentViewer from '@/components/content/Grade10ContentViewer';
import ExamsAnalytics from '@/pages/ExamsAnalytics';
const Grade10Management: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const { contentBackPath } = useBackPath();
  const [searchParams] = useSearchParams();
  
  // قراءة التبويب من URL
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>('');
  
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
  const isTeacher = userProfile?.role === 'teacher';
  
  // تحديد التبويب الافتراضي
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('view');
    }
  }, [tabFromUrl]);
  
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
          
          {/* التبويبات */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={isTeacher ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-1'}>
              <TabsTrigger value="view">عرض المحتوى</TabsTrigger>
              {isTeacher && <TabsTrigger value="exams">الامتحانات</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="view" className="animate-fade-in mt-6">
              {canManageContent ? <Grade10Content /> : <Grade10ContentViewer />}
            </TabsContent>
            
            {isTeacher && (
              <TabsContent value="exams" className="animate-fade-in mt-6">
                <ExamsAnalytics gradeLevel="10" />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      
      <AppFooter />
    </div>;
};
export default Grade10Management;