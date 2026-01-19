import React from 'react';
import { GraduationCap, Construction } from 'lucide-react';
import ModernHeader from '@/components/shared/ModernHeader';
import AppFooter from '@/components/shared/AppFooter';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';

const BagrutManagement: React.FC = () => {
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
      <ModernHeader 
        title="إدارة امتحانات البجروت" 
        showBackButton={true} 
        backPath="/content-management" 
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Under Development Card */}
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <GraduationCap className="h-20 w-20 text-orange-600" />
                  <Construction className="h-8 w-8 text-yellow-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-orange-900 mb-4">
                نظام امتحانات البجروت
              </h2>
              
              <p className="text-lg text-orange-700 mb-6">
                هذا النظام قيد التطوير حالياً
              </p>
              
              <div className="bg-white/70 rounded-lg p-6 text-right">
                <h3 className="font-semibold text-orange-800 mb-3">المميزات القادمة:</h3>
                <ul className="space-y-2 text-orange-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    إدارة امتحانات البجروت لجميع الصفوف
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    التحكم بإتاحة الامتحانات للصفوف المحددة
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    جدولة الامتحانات وتحديد مواعيدها
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    متابعة تقدم الطلاب والإحصائيات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    تقارير مفصلة عن أداء الطلاب
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default BagrutManagement;
