import React from 'react';
import { BookOpen, GraduationCap, Gamepad2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBackPath } from '@/hooks/useBackPath';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import Grade11Content from '@/components/content/Grade11Content';
import Grade11ContentViewer from '@/components/content/Grade11ContentViewer';
import Grade11SchoolAdminViewer from '@/components/content/Grade11SchoolAdminViewer';
import Grade11CourseViewer from '@/components/content/Grade11CourseViewer';
import GamesSection from '@/components/content/GamesSection';
import { EducationalTermsManager } from '@/components/content/EducationalTermsManager';
import { ContentGameLauncher } from '@/components/content/ContentGameLauncher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grade11ErrorBoundary } from '@/components/error-boundaries/Grade11ErrorBoundary';
import { ExamManagement } from '@/components/exam/ExamManagement';
const Grade11Management: React.FC = () => {
  console.log('🎯 Grade11Management component rendering...');
  const {
    userProfile
  } = useAuth();
  const {
    contentBackPath
  } = useBackPath();
  console.log('🔍 User profile in Grade11Management:', userProfile?.role);

  // Validate all imports are loaded correctly
  React.useEffect(() => {
    console.log('🔍 Validating Grade11Management dependencies:', {
      Grade11Content: !!Grade11Content,
      Grade11ContentViewer: !!Grade11ContentViewer,
      GamesSection: !!GamesSection,
      useAuth: !!useAuth,
      userProfile: !!userProfile
    });
  }, [userProfile]);

  // تحديد ما إذا كان المستخدم سوبر آدمن أو مدير مدرسة
  const canManageContent = userProfile?.role === 'superadmin';
  const isSchoolAdmin = userProfile?.role === 'school_admin';
  console.log('✅ Grade11Management permissions check:', {
    canManageContent
  });
  return <Grade11ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader title="إدارة محتوى الصف الحادي عشر" showBackButton={true} backPath={contentBackPath} showLogout={true} />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* عنوان الصفحة */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              
              
            </div>
          </div>
          
          {/* التبويبات الرئيسية */}
          <Tabs defaultValue={canManageContent ? 'manage' : isSchoolAdmin ? 'school-view' : 'view'} className="w-full">
            <TabsList className={canManageContent ? 'grid w-full grid-cols-5' : isSchoolAdmin ? 'grid w-full grid-cols-3' : 'grid w-full grid-cols-2'}>
              {canManageContent && <TabsTrigger value="manage">إدارة المحتوى</TabsTrigger>}
              {canManageContent && <TabsTrigger value="terms">المصطلحات التعليمية (Beta)</TabsTrigger>}
              {canManageContent && <TabsTrigger value="exams">الامتحانات</TabsTrigger>}
              {isSchoolAdmin && <TabsTrigger value="school-view">عرض مدير المدرسة</TabsTrigger>}
              <TabsTrigger value="view">عرض المحتوى</TabsTrigger>
              <TabsTrigger value="games">الألعاب التعليمية</TabsTrigger>
            </TabsList>

            {canManageContent && (
              <TabsContent value="manage">
                <Grade11Content />
              </TabsContent>
            )}

            {canManageContent && (
              <TabsContent value="terms">
                <EducationalTermsManager />
              </TabsContent>
            )}

            {canManageContent && (
              <TabsContent value="exams" className="space-y-6">
                <ExamManagement />
              </TabsContent>
            )}

            {isSchoolAdmin && (
              <TabsContent value="school-view">
                <Grade11SchoolAdminViewer />
              </TabsContent>
            )}

            <TabsContent value="view">
              <Grade11ContentViewer />
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <GamesSection canManageContent={canManageContent} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
        <AppFooter />
      </div>
    </Grade11ErrorBoundary>;
};
export default Grade11Management;