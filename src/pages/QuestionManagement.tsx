import React from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { QuestionManagementPanel } from '@/components/games/QuestionManagementPanel';

const QuestionManagement: React.FC = () => {
  const { userProfile } = useAuth();
  
  // التأكد من صلاحية الوصول
  const canManage = userProfile?.role === 'school_admin' || userProfile?.role === 'superadmin';
  
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <AppHeader title="غير مصرح" showBackButton={true} backPath="/dashboard" showLogout={true} />
        
        <main className="container mx-auto px-6 py-8 flex-1">
          <div className="max-w-md mx-auto text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">غير مصرح بالوصول</h2>
            <p className="text-muted-foreground">
              هذه الصفحة مخصصة لمدراء المدارس والمدراء العامين فقط
            </p>
          </div>
        </main>
        
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader title="إدارة أسئلة الألعاب التفاعلية" showBackButton={true} backPath="/content-management/grade-11" showLogout={true} />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <QuestionManagementPanel />
      </main>
      
      <AppFooter />
    </div>
  );
};

export default QuestionManagement;