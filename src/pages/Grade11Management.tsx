import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Gamepad2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBackPath } from '@/hooks/useBackPath';
import { useSearchParams } from 'react-router-dom';
import ModernHeader from '@/components/shared/ModernHeader';
import AppFooter from '@/components/shared/AppFooter';
import Grade11Content from '@/components/content/Grade11Content';
import Grade11ContentViewer from '@/components/content/Grade11ContentViewer';
import Grade11SchoolAdminViewer from '@/components/content/Grade11SchoolAdminViewer';
import Grade11CourseViewer from '@/components/content/Grade11CourseViewer';
import GamesSection from '@/components/content/GamesSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grade11ErrorBoundary } from '@/components/error-boundaries/Grade11ErrorBoundary';
const Grade11Management: React.FC = () => {
  console.log('🎯 Grade11Management component rendering...');
  const {
    userProfile
  } = useAuth();
  const {
    contentBackPath
  } = useBackPath();
  const [searchParams] = useSearchParams();
  
  // قراءة التبويب من URL
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>('');
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
  
  // تحديد التبويب الافتراضي بناءً على query parameter
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    } else {
      const defaultTab = canManageContent ? 'manage' : isSchoolAdmin ? 'school-view' : 'view';
      setActiveTab(defaultTab);
    }
  }, [tabFromUrl, canManageContent, isSchoolAdmin]);
  
  return <Grade11ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.015] to-secondary/[0.02]">
      <ModernHeader title="إدارة محتوى الصف الحادي عشر" showBackButton={true} backPath={contentBackPath} />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* عنوان الصفحة */}
          <div className="text-center space-y-6 py-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-full border border-primary/20">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">الصف الحادي عشر</h2>
            </div>
          </div>
          
          {/* التبويبات الرئيسية */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList 
              variant="primary"
              className={canManageContent ? 'grid w-full grid-cols-3' : isSchoolAdmin ? 'grid w-full grid-cols-3' : 'grid w-full grid-cols-2'}
            >
              {canManageContent && (
                <TabsTrigger value="manage" variant="primary">
                  <BookOpen className="h-5 w-5" />
                  إدارة المحتوى
                </TabsTrigger>
              )}
              {isSchoolAdmin && (
                <TabsTrigger value="school-view" variant="primary">
                  <GraduationCap className="h-5 w-5" />
                  عرض مدير المدرسة
                </TabsTrigger>
              )}
              <TabsTrigger value="view" variant="primary">
                <BookOpen className="h-5 w-5" />
                عرض المحتوى
              </TabsTrigger>
              <TabsTrigger value="games" variant="primary">
                <Gamepad2 className="h-5 w-5" />
                الألعاب التعليمية
              </TabsTrigger>
              {canManageContent && (
                <TabsTrigger value="tools" variant="primary">
                  <Wrench className="h-5 w-5" />
                  أدوات الصيانة
                </TabsTrigger>
              )}
            </TabsList>


            {canManageContent && (
              <TabsContent value="manage">
                <Grade11Content />
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

            <TabsContent value="games" className="space-y-6 mt-8">
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