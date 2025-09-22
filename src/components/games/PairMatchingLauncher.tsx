import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Puzzle, 
  Target, 
  Clock, 
  Zap, 
  Star,
  Trophy,
  Brain,
  Gamepad2
} from 'lucide-react';

interface PairMatchingLauncherProps {
  onLaunchGame: () => void;
}

export const PairMatchingLauncher: React.FC<PairMatchingLauncherProps> = ({ 
  onLaunchGame 
}) => {
  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-purple-mystic/5 via-cyan-electric/5 to-primary/5 border-primary/20 shadow-lg hover:shadow-primary/20 transition-all duration-300">
      <CardHeader className="relative overflow-hidden">
        {/* خلفية ديكورية */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-purple-mystic/20 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-cyan-electric/20 to-transparent rounded-full transform -translate-x-12 translate-y-12" />
        
        <div className="relative z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-mystic/20 to-cyan-electric/20 shadow-lg">
                <Puzzle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  مطابقة الكلمات
                </h2>
                <p className="text-muted-foreground mt-1">
                  لعبة تفاعلية لمطابقة المصطلحات بتعريفاتها
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge className="bg-gradient-to-r from-purple-mystic to-cyan-electric text-white font-semibold">
                جديد
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-primary">
                تفاعلي
              </Badge>
              <Badge variant="outline" className="border-accent/30 text-accent">
                تعليمي
              </Badge>
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        {/* ميزات اللعبة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-primary/10">
            <div className="p-2 rounded-lg bg-blue-electric/10">
              <Target className="h-5 w-5 text-blue-electric" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-electric">مطابقة دقيقة</h4>
              <p className="text-sm text-muted-foreground">اربط المصطلحات بتعريفاتها الصحيحة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-primary/10">
            <div className="p-2 rounded-lg bg-green-emerald/10">
              <Clock className="h-5 w-5 text-green-emerald" />
            </div>
            <div>
              <h4 className="font-semibold text-green-emerald">تحدي زمني</h4>
              <p className="text-sm text-muted-foreground">أكمل المطابقات في الوقت المحدد</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-primary/10">
            <div className="p-2 rounded-lg bg-yellow-electric/10">
              <Zap className="h-5 w-5 text-yellow-electric" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-electric">نقاط فورية</h4>
              <p className="text-sm text-muted-foreground">احصل على نقاط عند كل مطابقة صحيحة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-primary/10">
            <div className="p-2 rounded-lg bg-purple-mystic/10">
              <Brain className="h-5 w-5 text-purple-mystic" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-mystic">تعزيز الذاكرة</h4>
              <p className="text-sm text-muted-foreground">طور مهاراتك في الحفظ والفهم</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* وصف اللعبة */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            كيفية اللعب
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                اقرأ المصطلح في العمود الأيسر
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                ابحث عن التعريف المناسب في العمود الأيمن
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                انقر على المصطلح ثم على تعريفه
              </li>
            </ul>
            
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                احصل على 10 نقاط لكل مطابقة صحيحة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                تعلم من الشروحات التفصيلية
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                تحدى نفسك لتحسين وقتك
              </li>
            </ul>
          </div>
        </div>

        <Separator />

        {/* إحصائيات اللعبة */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-xl border border-primary/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">6</div>
              <div className="text-xs text-muted-foreground">كلمات مطابقة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">5</div>
              <div className="text-xs text-muted-foreground">دقائق للإكمال</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-emerald">60</div>
              <div className="text-xs text-muted-foreground">نقطة كحد أقصى</div>
            </div>
          </div>
        </div>

        {/* زر البدء */}
        <Button 
          onClick={onLaunchGame}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-purple-mystic to-accent hover:shadow-xl hover:shadow-primary/30 transition-all duration-500 group"
          size="lg"
        >
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>ابدأ المطابقة الآن!</span>
            <Trophy className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </Button>

        {/* نصائح سريعة */}
        <div className="text-center p-4 bg-muted/20 rounded-lg border border-primary/5">
          <p className="text-xs text-muted-foreground">
            💡 <strong>نصيحة:</strong> كلما كنت أسرع في المطابقة، كلما حصلت على نقاط أكثر!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};