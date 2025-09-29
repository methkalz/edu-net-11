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
          bgClass: 'stat-videos-bg',
          iconColor: 'text-stat-videos'
        };
      case 'teacher':
        return {
          title: 'مضامين الصفوف',
          subtitle: 'للمعلمين',
          description: 'اطلع على المضامين التعليمية لصفوفك وأنشئ مخططات دروسك',
          icon: BookOpen,
          bgClass: 'stat-progress-bg',
          iconColor: 'text-stat-progress'
        };
      case 'student':
        return {
          title: 'المواد التعليمية',
          subtitle: 'للطلاب',
          description: 'اطلع على المواد التعليمية لصفك وتابع تقدمك الدراسي',
          icon: Video,
          bgClass: 'stat-achievements-bg',
          iconColor: 'text-stat-achievements'
        };
      default:
        return {
          title: 'المضامين التعليمية',
          subtitle: 'مشاهدة',
          description: 'اطلع على المضامين التعليمية المتاحة',
          icon: Eye,
          bgClass: 'glass-surface',
          iconColor: 'text-foreground-secondary'
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
            <div className={`inline-flex items-center gap-3 ${config.bgClass} ${config.iconColor} px-6 py-3 rounded-full border border-border/30 shadow-sm`}>
              <config.icon className="h-6 w-6" />
              <span className="font-semibold text-foreground">{config.subtitle}</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground text-center">
              {config.title}
            </h2>
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
              {config.description}
            </p>
            
            {/* مؤشر مستوى الوصول */}
            <div className="flex justify-center mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-surface rounded-full text-sm border border-border/30">
                <div className={`w-2 h-2 rounded-full ${
                  accessLevel === 'MANAGE' ? 'bg-stat-progress' :
                  accessLevel === 'REVIEW' ? 'bg-stat-videos' :
                  accessLevel === 'CUSTOM' ? 'bg-stat-points' :
                  'bg-foreground-muted'
                }`}></div>
                <span className="text-foreground-secondary">
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