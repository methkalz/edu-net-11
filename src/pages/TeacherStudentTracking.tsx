import React from 'react';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { StudentProgressOverview } from '@/components/teacher/StudentProgressOverview';

const TeacherStudentTracking: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <AppHeader 
        title="تتبع تقدم الطلاب" 
        showBackButton={true} 
        backPath="/dashboard" 
        showLogout={true} 
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          <StudentProgressOverview />
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default TeacherStudentTracking;
