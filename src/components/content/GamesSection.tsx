import React, { useState } from 'react';
import { Gamepad2, Trophy, Zap, Target, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import KnowledgeAdventureRealContent from '@/components/games/KnowledgeAdventureRealContent';

interface GamesSectionProps {
  canManageContent: boolean;
}

const GamesSection: React.FC<GamesSectionProps> = ({ canManageContent }) => {
  const navigate = useNavigate();
  const [showNetworkAdventure, setShowNetworkAdventure] = useState(false);

  const games = [
    {
      id: 'pair-matching',
      title: 'مطابقة الكلمات',
      description: 'لعبة تفاعلية لتطوير مهارات الذاكرة والتركيز',
      icon: Target,
      color: 'bg-blue-500',
      features: ['تحدي زمني', 'مطابقة دقيقة', 'نقاط فورية'],
      action: () => navigate('/pair-matching'),
      buttonText: 'ابدأ اللعبة'
    },
    {
      id: 'network-adventure',
      title: 'مغامرة الشبكات',
      description: 'رحلة تعليمية تفاعلية لاستكشاف عالم الشبكات والبرمجة',
      icon: Map,
      color: 'bg-green-500',
      features: ['استكشاف تفاعلي', 'تحديات ذكية', 'مستويات متقدمة'],
      action: () => setShowNetworkAdventure(true),
      buttonText: 'ابدأ المغامرة'
    },
  ];

  return (
    <div className="space-y-8">
      {/* شبكة الألعاب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {games.map((game) => (
          <Card key={game.id} className="hover:shadow-xl transition-all duration-300 group border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${game.color} text-white group-hover:scale-110 transition-all duration-300 shadow-md`}>
                  <game.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold mb-2">{game.title}</CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {game.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-5">
              {/* مميزات اللعبة */}
              <div className="flex flex-wrap gap-2">
                {game.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 border-orange-200">
                    {feature}
                  </Badge>
                ))}
              </div>

              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200 flex flex-col items-center justify-center">
                  <div className="text-xs text-muted-foreground mb-1">المستوى</div>
                  <div className="font-bold text-gray-700">متوسط</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200 flex flex-col items-center justify-center">
                  <div className="text-xs text-muted-foreground mb-1">الوقت</div>
                  <div className="font-bold text-gray-700">5-10 د</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200 flex flex-col items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-600 mb-1" />
                  <div className="text-xs font-bold text-yellow-700">نقاط</div>
                </div>
              </div>

              {/* زر اللعبة */}
              <Button 
                onClick={game.action}
                className="w-full group-hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                {game.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}

      </div>

      {/* حوار مغامرة الشبكات */}
      <Dialog open={showNetworkAdventure} onOpenChange={setShowNetworkAdventure}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <div className="h-[80vh]">
            <KnowledgeAdventureRealContent />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamesSection;