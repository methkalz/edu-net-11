import React from 'react';
import { BookOpen, Eye, BookMarked, Video } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import GradeCards from '@/components/content/GradeCards';
import { useAuth } from '@/hooks/useAuth';
import { useContentPermissions } from '@/hooks/useContentPermissions';

const EducationalContent: React.FC = () => {
  const { userProfile } = useAuth();
  const { accessLevel } = useContentPermissions();

  // تحديد العناوين والأوصاف حسب الدور
  const getContentConfig = () => {
    switch (userProfile?.role) {
      case 'school_admin':
        return {
          title: 'المضامين التعليمية',
          subtitle: 'مراجعة وإشراف',
          description: 'اطلع على المضامين التعليمية المتاحة للصفوف وراجع المحتوى التعليمي',
          icon: BookMarked,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'teacher':
        return {
          title: 'مضامين الصفوف',
          subtitle: 'للمعلمين',
          description: 'اطلع على المضامين التعليمية لصفوفك وأنشئ مخططات دروسك',
          icon: BookOpen,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'student':
        return {
          title: 'المواد التعليمية',
          subtitle: 'للطلاب',
          description: 'اطلع على المواد التعليمية لصفك وتابع تقدمك الدراسي',
          icon: Video,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-100'
        };
      default:
        return {
          title: 'المضامين التعليمية',
          subtitle: 'مشاهدة',
          description: 'اطلع على المضامين التعليمية المتاحة',
          icon: Eye,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const config = getContentConfig();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader 
        title={config.title}
        showBackButton={true}
        backPath="/dashboard"
        showLogout={true}
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center gap-3 ${config.bgColor} ${config.iconColor} px-6 py-3 rounded-full`}>
              <config.icon className="h-6 w-6" />
              <span className="font-semibold">{config.subtitle}</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground text-center">
              {config.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {config.description}
            </p>
            
            {/* مؤشر مستوى الوصول */}
            <div className="flex justify-center mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  accessLevel === 'MANAGE' ? 'bg-green-500' :
                  accessLevel === 'REVIEW' ? 'bg-blue-500' :
                  accessLevel === 'CUSTOM' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-muted-foreground">
                  {accessLevel === 'MANAGE' ? 'صلاحيات إدارية كاملة' :
                   accessLevel === 'REVIEW' ? 'صلاحيات مراجعة وإشراف' :
                   accessLevel === 'CUSTOM' ? 'صلاحيات مخصصة للمعلم' :
                   'صلاحيات المشاهدة فقط'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="animate-fade-in">
            <GradeCards />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default EducationalContent;