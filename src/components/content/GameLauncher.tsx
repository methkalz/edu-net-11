import React from 'react';
import { Gamepad2, Star, Trophy, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameLauncherProps {
  onLaunchGame: () => void;
}

const GameLauncher: React.FC<GameLauncherProps> = ({ onLaunchGame }) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">مغامرة المعرفة</CardTitle>
            <p className="text-muted-foreground">لعبة تعليمية تفاعلية مبتكرة</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge className="bg-green-500 text-white">جديد</Badge>
          <Badge className="bg-blue-500 text-white">تفاعلي</Badge>
          <Badge className="bg-purple-500 text-white">تعليمي</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <h4 className="font-bold mb-1">نظام الخبرة</h4>
            <p className="text-sm text-muted-foreground">اكسب نقاط وتقدم في المستويات</p>
          </div>
          
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h4 className="font-bold mb-1">إنجازات وجوائز</h4>
            <p className="text-sm text-muted-foreground">اجمع الإنجازات والشارات</p>
          </div>
          
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h4 className="font-bold mb-1">تحديات يومية</h4>
            <p className="text-sm text-muted-foreground">مهام جديدة كل يوم</p>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-bold mb-2">ميزات اللعبة:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• خريطة تفاعلية لاستكشاف المواضيع المختلفة</li>
            <li>• اختبارات تفاعلية مع أسئلة متنوعة من المنهج</li>
            <li>• نظام المكافآت والعملات الافتراضية</li>
            <li>• لوحة المتصدرين للتنافس مع الطلاب الآخرين</li>
            <li>• تتبع التقدم والإحصائيات الشخصية</li>
            <li>• تصاميم جذابة ورسوم متحركة مسلية</li>
          </ul>
        </div>
        
        <div className="text-center">
          <Button 
            onClick={onLaunchGame}
            size="lg"
            className="text-lg px-8 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Gamepad2 className="h-5 w-5 mr-2" />
            ابدأ المغامرة الآن!
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            تجربة تعليمية ممتعة ومفيدة للصف الحادي عشر
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameLauncher;