/**
 * Student Tracking Page
 * صفحة تتبع تقدم الطلاب للمعلمين
 */

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import StudentProgressOverview from '@/components/teacher/StudentProgressOverview';

const StudentTrackingPage: React.FC = () => {
  const { userProfile } = useAuth();

  // التحقق من صلاحية الوصول - المعلمون فقط
  if (!userProfile || userProfile.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <StudentProgressOverview />
      </div>
    </div>
  );
};

export default StudentTrackingPage;
