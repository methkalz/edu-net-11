import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/types/badge';
import { AVAILABLE_BADGES } from '@/utils/badgeSystem';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-background p-6 md:p-12" dir="rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-8 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة
        </Button>

        <div className="mb-16 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            اختبار الأوسمة
          </h1>
          <p className="text-muted-foreground text-base">
            اختبر نوافذ الاحتفال بالأوسمة المختلفة
          </p>
        </div>

        {/* Control Panel - Minimalist */}
        <div className="mb-12 pb-8 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1">الأوسمة المتاحة</p>
                <p className="text-2xl font-semibold">{AVAILABLE_BADGES.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">المحتفل بها</p>
                <p className="text-2xl font-semibold">{celebratedCount}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleClearMemory}
              className="gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              مسح الذاكرة
            </Button>
          </div>
        </div>

        {/* Badges Grid - Minimalist */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {AVAILABLE_BADGES.map((badge) => (
            <div
              key={badge.id}
              className="group border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card"
            >
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4">
                  <img
                    src={badge.image}
                    alt={badge.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-lg font-semibold text-center mb-1">{badge.name}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {badge.description}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm px-3 py-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">النقاط</span>
                  <span className="font-medium">{badge.minPoints} - {badge.maxPoints}</span>
                </div>
              </div>

              <Button
                onClick={() => handleTestBadge(badge)}
                variant="outline"
                className="w-full gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                اختبار الاحتفال
              </Button>
            </div>
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
