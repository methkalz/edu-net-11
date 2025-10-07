import React from 'react';
import { Settings, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import GradeCards from '@/components/content/GradeCards';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const ContentManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // هذه الصفحة مخصصة للسوبر آدمن فقط
  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-muted-foreground">هذه الصفحة مخصصة لمدراء النظام فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader 
        title="إدارة المضامين التعليمية" 
        showBackButton={true}
        backPath="/dashboard"
        showLogout={true}
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-red-100 text-red-700 px-6 py-3 rounded-full">
              <Settings className="h-6 w-6" />
              <span className="font-semibold">نظام الإدارة الكاملة للمضامين</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground text-center">
              إدارة المضامين التعليمية
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              إدارة شاملة وتحكم كامل في المحتوى التعليمي للصفوف الدراسية مع صلاحيات الإنشاء والتعديل والحذف
            </p>
            
            {/* تنبيه للمدراء */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-amber-800">
                <Shield className="h-5 w-5" />
                <span className="font-medium">صلاحيات إدارية</span>
              </div>
              <p className="text-amber-700 text-sm mt-1">
                أنت تدخل كمدير نظام مع صلاحيات كاملة للإنشاء والتعديل والحذف
              </p>
            </div>
          </div>
          
          <div className="animate-fade-in space-y-8">
            {/* Google Docs Management Card */}
            <Card 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200"
              onClick={() => navigate('/google-docs')}
            >
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

            {/* Grade Cards */}
            <GradeCards />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default ContentManagement;