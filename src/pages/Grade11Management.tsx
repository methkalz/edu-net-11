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

const Grade11Management: React.FC = () => {
  console.log('🎯 Grade11Management component rendering...');
  
  const {
    userProfile
  } = useAuth();
  const { contentBackPath } = useBackPath();

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
  
  console.log('✅ Grade11Management permissions check:', { canManageContent });
  
  return (
    <Grade11ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader title="إدارة محتوى الصف الحادي عشر" showBackButton={true} backPath={contentBackPath} showLogout={true} />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* عنوان الصفحة */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="inline-flex items-center gap-3 bg-green-100 text-green-700 px-6 py-3 rounded-full">
                <BookOpen className="h-6 w-6" />
                <span className="font-semibold">الصف الحادي عشر</span>
              </div>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-6 py-3 rounded-full shadow-sm border border-purple-200">
                <Gamepad2 className="h-5 w-5" />
                <span className="font-semibold">الألعاب التفاعلية</span>
              </div>
            </div>
          </div>
          
          {/* التبويبات الرئيسية */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                المحتوى التعليمي
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                الألعاب التفاعلية
              </TabsTrigger>
            </TabsList>
            
            {/* محتوى التبويب الأول - المحتوى التعليمي */}
            <TabsContent value="content" className="mt-8">
              <div className="animate-fade-in">
                {canManageContent ? (
                  <Grade11Content />
                ) : (
                  <Grade11CourseViewer />
                )}
              </div>
            </TabsContent>
            
            {/* محتوى التبويب الثاني - الألعاب التفاعلية */}
            <TabsContent value="games" className="mt-8">
              <div className="animate-fade-in">
                <GamesSection canManageContent={canManageContent} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
        <AppFooter />
      </div>
    </Grade11ErrorBoundary>
  );
};
export default Grade11Management;