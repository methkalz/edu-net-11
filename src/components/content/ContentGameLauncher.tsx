import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGrade11Content } from '@/hooks/useGrade11Content';
import { useGrade11EducationalTerms } from '@/hooks/useGrade11EducationalTerms';
import { usePairMatching } from '@/hooks/usePairMatching';
import { GamepadIcon, Sparkles, Clock, Target, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { PairMatchingGame } from '@/components/games/PairMatchingGame';

export const ContentGameLauncher: React.FC = () => {
  const { sections, loading: sectionsLoading } = useGrade11Content();
  const { getTermsForSection } = useGrade11EducationalTerms();
  const { games, fetchGamesWithProgress } = usePairMatching();
  
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [availableTerms, setAvailableTerms] = useState<any[]>([]);
  const [contentGames, setContentGames] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [showGame, setShowGame] = useState(false);

  // جلب المصطلحات عند تغيير القسم
  useEffect(() => {
    if (selectedSection) {
      loadSectionTerms();
      loadContentGames();
    }
  }, [selectedSection]);

  const loadSectionTerms = async () => {
    try {
      const terms = await getTermsForSection(selectedSection, true);
      setAvailableTerms(terms);
    } catch (error) {
      console.error('Error loading terms:', error);
    }
  };

  const loadContentGames = () => {
    // فلترة الألعاب المرتبطة بالمحتوى التعليمي فقط
    const filteredGames = games.filter(game => 
      game.subject === 'networks' && 
      game.grade_level === '11' &&
      game.description?.includes('المحتوى التعليمي')
    );
    setContentGames(filteredGames);
  };

  const handlePlayGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setShowGame(true);
  };

  const handleBackToLauncher = () => {
    setShowGame(false);
    setSelectedGameId('');
  };

  if (showGame && selectedGameId) {
    return (
      <div className="space-y-4">
        <Button onClick={handleBackToLauncher} variant="outline">
          العودة لقائمة الألعاب
        </Button>
        <PairMatchingGame gameId={selectedGameId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GamepadIcon className="h-5 w-5 text-primary" />
            ألعاب المحتوى التعليمي
          </CardTitle>
          <CardDescription>
            ألعاب مطابقة تفاعلية مستندة إلى المحتوى التعليمي للصف الحادي عشر
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* اختيار القسم */}
          <div>
            <label className="block text-sm font-medium mb-2">اختر القسم التعليمي</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم التعليمي" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* إحصائيات القسم */}
          {selectedSection && availableTerms.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">إحصائيات القسم المحدد:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{availableTerms.length}</div>
                  <div className="text-muted-foreground">مصطلح معتمد</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-secondary">
                    {availableTerms.filter(t => t.difficulty_level === 'easy').length}
                  </div>
                  <div className="text-muted-foreground">مصطلح سهل</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">
                    {availableTerms.filter(t => t.difficulty_level === 'hard').length}
                  </div>
                  <div className="text-muted-foreground">مصطلح صعب</div>
                </div>
              </div>
            </div>
          )}

          {/* الألعاب المتاحة */}
          {contentGames.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium">الألعاب المتاحة:</h4>
              <div className="grid gap-4">
                {contentGames.map((game) => (
                  <Card key={game.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{game.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            {game.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              className={
                                game.difficulty_level === 'easy' ? 'bg-success text-success-foreground' :
                                game.difficulty_level === 'medium' ? 'bg-warning text-warning-foreground' :
                                'bg-destructive text-destructive-foreground'
                              }
                            >
                              {game.difficulty_level}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {Math.floor(game.time_limit_seconds / 60)} دقيقة
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Target className="h-3 w-3" />
                              {game.max_pairs} زوج
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button onClick={() => handlePlayGame(game.id)}>
                            <GamepadIcon className="mr-2 h-4 w-4" />
                            العب الآن
                          </Button>
                          {game.progress?.isCompleted && (
                            <Badge variant="secondary" className="text-xs">
                              مكتملة ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : selectedSection ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد ألعاب متاحة لهذا القسم حالياً</p>
              <p className="text-sm mt-2">
                يمكن للمعلم إنشاء ألعاب جديدة من إدارة المصطلحات التعليمية
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>اختر قسماً تعليمياً لعرض الألعاب المتاحة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};