import React from 'react';
import { Shield, FileText, BookOpen, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModernHeader from '@/components/shared/ModernHeader';
import AppFooter from '@/components/shared/AppFooter';
import GradeCards from '@/components/content/GradeCards';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const ContentManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // هذه الصفحة مخصصة للسوبر آدمن فقط
  if (userProfile?.role !== 'superadmin') {
    return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-muted-foreground">هذه الصفحة مخصصة لمدراء النظام فقط</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <ModernHeader title="إدارة المضامين التعليمية" showBackButton={true} backPath="/dashboard" />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          
          
          <div className="animate-fade-in space-y-8">
            {/* Google Docs Management Card */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200" onClick={() => navigate('/google-docs')}>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <FileText className="h-10 w-10 text-blue-600" />
                  <h3 className="text-2xl font-bold">إدارة مستندات Google Docs</h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  إنشاء وإدارة مستندات Google Docs للطلاب مع إمكانية المشاركة والتحرير المباشر
                </p>
              </CardContent>
            </Card>

            {/* Exam Bank Management Card */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200" onClick={() => navigate('/exam-bank-management')}>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <BookOpen className="h-10 w-10 text-green-600" />
                  <h3 className="text-2xl font-bold">إدارة بنك أسئلة الامتحانات</h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  إدارة الأسئلة لجميع الصفوف (10، 11، 12) من مكان واحد مع فلاتر متقدمة وإحصائيات شاملة
                </p>
              </CardContent>
            </Card>

            {/* Bagrut Exams Management Card */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-200" onClick={() => navigate('/bagrut-management')}>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <GraduationCap className="h-10 w-10 text-orange-600" />
                  <h3 className="text-2xl font-bold">إدارة امتحانات البجروت</h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  إدارة امتحانات البجروت والتحكم بإتاحتها للصفوف المختلفة مع متابعة تقدم الطلاب
                </p>
              </CardContent>
            </Card>


            {/* Grade Cards */}
            <GradeCards />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>;
};
export default ContentManagement;