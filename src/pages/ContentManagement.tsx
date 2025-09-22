import React from 'react';
import { Settings, Shield } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import GradeCards from '@/components/content/GradeCards';
import { useAuth } from '@/hooks/useAuth';

const ContentManagement: React.FC = () => {
  const { userProfile } = useAuth();

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
          
          <div className="animate-fade-in">
            <GradeCards />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default ContentManagement;