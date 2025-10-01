import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/types/badge';
import { AVAILABLE_BADGES } from '@/utils/badgeSystem';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { ArrowLeft, Trophy, Trash2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BadgeTestPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const [celebratedCount, setCelebratedCount] = useState(() => {
    try {
      const stored = localStorage.getItem('celebrated_badges');
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  });

  const handleTestBadge = (badge: Badge) => {
    setActiveBadge(badge);
  };

  const handleCloseCelebration = () => {
    setActiveBadge(null);
  };

  const handleClearMemory = () => {
    try {
      localStorage.removeItem('celebrated_badges');
      setCelebratedCount(0);
      toast({
        title: "تم مسح الذاكرة",
        description: "تم حذف جميع الأوسمة المحتفل بها من الذاكرة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الذاكرة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            اختبار نوافذ الاحتفال بالأوسمة
          </h1>
          <p className="text-muted-foreground text-lg">
            صفحة خاصة لاختبار جميع نوافذ الاحتفال بالأوسمة
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              لوحة التحكم
            </CardTitle>
            <CardDescription>
              معلومات وإحصائيات حول الأوسمة المحتفل بها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">عدد الأوسمة المتاحة</p>
                  <p className="text-3xl font-bold text-primary">{AVAILABLE_BADGES.length}</p>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">الأوسمة المحتفل بها</p>
                  <p className="text-3xl font-bold text-orange-600">{celebratedCount}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearMemory}
                className="gap-2 w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4" />
                مسح ذاكرة الاحتفالات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_BADGES.map((badge) => (
            <Card 
              key={badge.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 bg-gradient-to-br from-card to-muted/20"
            >
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-32 h-32 mx-auto relative">
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {badge.minPoints}-{badge.maxPoints}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{badge.name}</CardTitle>
                <CardDescription className="text-sm">
                  {badge.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground">الحد الأدنى:</span>
                    <span className="font-bold text-primary">{badge.minPoints} نقطة</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground">الحد الأقصى:</span>
                    <span className="font-bold text-orange-600">{badge.maxPoints} نقطة</span>
                  </div>
                  <Button
                    onClick={() => handleTestBadge(badge)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Trophy className="w-4 h-4 ml-2" />
                    اختبار الاحتفال
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Celebration Window */}
      {activeBadge && (
        <BadgeCelebration
          badge={activeBadge}
          studentName="اختبار الوسام"
          onClose={handleCloseCelebration}
        />
      )}
    </div>
  );
};

export default BadgeTestPage;
