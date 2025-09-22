import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, BookOpen, Users, Database, Activity } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  grade_level: string;
  subject: string;
  is_active: boolean;
  description?: string;
}

interface GameSelectorProps {
  selectedGame: Game | null;
  onGameSelect: (game: Game | null) => void;
}

export const GameSelector = ({ selectedGame, onGameSelect }: GameSelectorProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('grade_level', { ascending: true });

      if (error) throw error;
      setGames(data || []);
      
      // البدء بخيار "جميع الألعاب" كافتراضي
      if (!selectedGame) {
        onGameSelect(null);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeIcon = (gradeLevel: string) => {
    switch (gradeLevel) {
      case '10': return '🏃';
      case '11': return '🎯';
      case '12': return '🏆';
      default: return '📚';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'networks': return '🌐';
      case 'programming': return '💻';
      case 'security': return '🔒';
      case 'databases': return '🗄️';
      case 'matching': return '🧩';
      default: return '📖';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card animate-fade-in">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary shadow-glow"></div>
            <p className="text-muted-foreground animate-pulse">جاري تحميل الألعاب...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 transition-all duration-300 animate-fade-in shadow-lg hover:shadow-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-4 border-b border-primary/10">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Gamepad2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
              اختيار اللعبة
            </span>
            <p className="text-sm text-muted-foreground mt-1">اختر لعبة لعرض إحصائياتها</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="text-lg">🎯</span>
            اللعبة النشطة:
          </label>
          <Select
            value={selectedGame?.id || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                onGameSelect(null);
              } else {
                const game = games.find(g => g.id === value);
                onGameSelect(game || null);
              }
            }}
          >
            <SelectTrigger className="w-full h-12 glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="اختر لعبة..." />
            </SelectTrigger>
            <SelectContent className="glass-card border-primary/20 backdrop-blur-md">
              <SelectItem value="all">جميع الألعاب</SelectItem>
              {games.map((game) => (
                <SelectItem key={game.id} value={game.id}>
                  <div className="flex items-center gap-2">
                    <span>{getGradeIcon(game.grade_level)}</span>
                    <span>{getSubjectIcon(game.subject)}</span>
                    <span>{game.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      صف {game.grade_level}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGame && (
          <div className="space-y-4 p-6 glass-card bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-2xl animate-fade-in transition-all duration-300 shadow-lg hover:shadow-primary/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-3">
                <span className="text-2xl animate-float">{getGradeIcon(selectedGame.grade_level)}</span>
                <span className="text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {selectedGame.name}
                </span>
              </h3>
              <div className="flex gap-3">
                <Badge variant="default" className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 font-semibold">
                  {getSubjectIcon(selectedGame.subject)} {selectedGame.subject}
                </Badge>
                <Badge variant="outline" className="border-accent/50 text-accent px-4 py-2 font-semibold">
                  <BookOpen className="h-4 w-4 ml-1" />
                  صف {selectedGame.grade_level}
                </Badge>
              </div>
            </div>
            
            {selectedGame.description && (
              <div className="p-4 bg-background/50 rounded-xl border border-primary/10">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {selectedGame.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-primary/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">نشط ومتاح</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Gamepad2 className="h-4 w-4" />
                  <span className="text-sm font-medium">لعبة تفاعلية</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">متصل الآن</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center p-3 glass-card bg-muted/20 rounded-lg border border-primary/10">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            <span>{games.length > 0 ? `${games.length} ألعاب متاحة` : 'لا توجد ألعاب'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};