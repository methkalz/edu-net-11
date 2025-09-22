import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EducationalTermsManager } from '@/components/content/EducationalTermsManager';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';

export const ContentTermsManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generatedGameId, setGeneratedGameId] = useState<string | null>(null);

  const canManageContent = user?.user_metadata?.role === 'school_admin' || user?.user_metadata?.role === 'superadmin';

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              غير مصرح لك بالوصول
            </h1>
            <p className="text-muted-foreground mb-6">
              هذه الصفحة مخصصة لمديري المدارس فقط
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const handleGameGenerated = (gameId: string) => {
    setGeneratedGameId(gameId);
    // يمكن إضافة المزيد من التفاعل هنا مثل إعادة التوجيه للعبة
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/grade11-management')} 
            variant="outline" 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة لإدارة الصف الحادي عشر
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
              <BookOpen className="h-8 w-8" />
              إدارة المصطلحات التعليمية
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              استخراج المصطلحات التقنية من المحتوى التعليمي وإنشاء ألعاب مطابقة تفاعلية 
              مرتبطة بالمنهج الدراسي للصف الحادي عشر
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                نظام المصطلحات الذكي
              </CardTitle>
              <CardDescription>
                استخدام الذكاء الصطناعي لاستخراج المصطلحات التقنية من محتوى الدروس وإنشاء ألعاب تعليمية تفاعلية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EducationalTermsManager onGameGenerated={handleGameGenerated} />
            </CardContent>
          </Card>

          {generatedGameId && (
            <Card className="border-2 border-success/20 bg-gradient-to-r from-success/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-success">تم إنشاء اللعبة بنجاح! 🎉</CardTitle>
                <CardDescription>
                  يمكنك الآن تجربة اللعبة الجديدة أو إنشاء المزيد من الألعاب
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={() => navigate(`/pair-matching?gameId=${generatedGameId}`)}>
                    تجربة اللعبة الآن
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/pair-matching')}
                  >
                    عرض جميع الألعاب
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات النظام</CardTitle>
              <CardDescription>
                نظرة سريعة على المصطلحات والألعاب المتاحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">16</div>
                  <div className="text-sm text-muted-foreground">مصطلح معتمد</div>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">5</div>
                  <div className="text-sm text-muted-foreground">قسم تعليمي</div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <div className="text-2xl font-bold text-accent">10</div>
                  <div className="text-sm text-muted-foreground">لعبة متاحة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AppFooter />
    </div>
  );
};