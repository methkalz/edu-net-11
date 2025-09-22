import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { 
  Home, 
  Shield, 
  School, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  Package,
  Puzzle,
  GraduationCap,
  Video,
  Trophy,
  UserCheck
} from 'lucide-react';

const Test: React.FC = () => {
  const navigate = useNavigate();

  const pages = [
    { 
      name: 'الرئيسية', 
      path: '/', 
      icon: Home, 
      description: 'الصفحة الرئيسية للنظام',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    { 
      name: 'لوحة التحكم', 
      path: '/dashboard', 
      icon: Home, 
      description: 'لوحة التحكم الرئيسية',
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    { 
      name: 'تسجيل الدخول', 
      path: '/auth', 
      icon: Shield, 
      description: 'صفحة تسجيل الدخول والتسجيل',
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    { 
      name: 'مصادقة المدير العام', 
      path: '/super-admin-auth', 
      icon: UserCheck, 
      description: 'مصادقة المدير العام للنظام',
      color: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    { 
      name: 'إدارة المدارس', 
      path: '/school-management', 
      icon: School, 
      description: 'إدارة المدارس والمؤسسات التعليمية',
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    },
    { 
      name: 'إدارة مديري المدارس', 
      path: '/school-admin-management', 
      icon: GraduationCap, 
      description: 'إدارة مديري المدارس',
      color: 'bg-teal-100 text-teal-700 hover:bg-teal-200'
    },
    { 
      name: 'إدارة المستخدمين', 
      path: '/user-management', 
      icon: Users, 
      description: 'إدارة حسابات المستخدمين',
      color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    },
    { 
      name: 'إدارة الطلاب', 
      path: '/student-management', 
      icon: Users, 
      description: 'إدارة الطلاب والملفات الشخصية',
      color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
    },
    { 
      name: 'إدارة المضامين', 
      path: '/content-management', 
      icon: BookOpen, 
      description: 'إدارة المحتوى التعليمي',
      color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
    },
    { 
      name: 'إدارة الصف العاشر', 
      path: '/grade10-management', 
      icon: Video, 
      description: 'إدارة محتوى الصف العاشر',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    { 
      name: 'إدارة الصف الحادي عشر', 
      path: '/grade11-management', 
      icon: BookOpen, 
      description: 'إدارة محتوى الصف الحادي عشر',
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    { 
      name: 'إدارة الصف الثاني عشر', 
      path: '/grade12-management', 
      icon: Trophy, 
      description: 'إدارة محتوى الصف الثاني عشر',
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    { 
      name: 'الصفوف الدراسية', 
      path: '/school-classes', 
      icon: School, 
      description: 'إدارة الصفوف والشعب الدراسية',
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    },
    { 
      name: 'السنوات الأكاديمية', 
      path: '/academic-years', 
      icon: Calendar, 
      description: 'إدارة السنوات والفصول الدراسية',
      color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
    },
    { 
      name: 'إدارة التقويم', 
      path: '/calendar-management', 
      icon: Calendar, 
      description: 'إدارة الأحداث والمواعيد',
      color: 'bg-rose-100 text-rose-700 hover:bg-rose-200'
    },
    { 
      name: 'إعدادات النظام', 
      path: '/system-settings', 
      icon: Settings, 
      description: 'إعدادات وتكوين النظام',
      color: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    },
    { 
      name: 'إدارة الحزم', 
      path: '/package-management', 
      icon: Package, 
      description: 'إدارة حزم وخدمات النظام',
      color: 'bg-amber-100 text-amber-700 hover:bg-amber-200'
    },
    { 
      name: 'إدارة الإضافات', 
      path: '/plugin-management', 
      icon: Puzzle, 
      description: 'إدارة الإضافات والملحقات',
      color: 'bg-lime-100 text-lime-700 hover:bg-lime-200'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader 
        title="صفحة الاختبار - التنقل السريع" 
        showBackButton={true}
        backPath="/dashboard"
        showLogout={true}
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-3 rounded-full">
              <Settings className="h-6 w-6" />
              <span className="font-semibold">صفحة الاختبار والتطوير</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              التنقل السريع بين الصفحات
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              استخدم هذه الصفحة للتنقل السريع بين جميع صفحات النظام أثناء التطوير والاختبار
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">جميع صفحات النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pages.map((page, index) => {
                  const IconComponent = page.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={`h-auto p-4 flex flex-col items-center gap-3 transition-all duration-200 ${page.color}`}
                      onClick={() => handleNavigation(page.path)}
                    >
                      <IconComponent className="h-8 w-8" />
                      <div className="text-center">
                        <div className="font-semibold text-sm">{page.name}</div>
                        <div className="text-xs opacity-70 mt-1">{page.description}</div>
                        <div className="text-xs font-mono mt-1 opacity-50">{page.path}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground">معلومات التطوير</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                هذه الصفحة مخصصة للتطوير والاختبار فقط
              </p>
              <p className="text-xs text-muted-foreground">
                يمكن الوصول إليها عبر: <code className="bg-background px-2 py-1 rounded">/test</code>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default Test;