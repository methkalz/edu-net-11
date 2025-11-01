import React from 'react';
import { MapPin, Lock, CheckCircle, Star, Book, Network, Server, Users, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameTopic, PlayerProgress } from '@/hooks/useGrade11Game';

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

interface GameMapRealProps {
  topics: GameTopic[];
  progress: Record<string, PlayerProgress>;
  isTopicUnlocked: (index: number) => boolean;
  onSelectTopic: (topicId: string) => void;
}

const LESSON_ICONS = {
  'أجهزة الشبكة': Network,
  'البروتوكولات': Server,
  'العناوين': Users,
  'Switch': Wifi,
  'Router': Server,
  'Hub': Star,
  'Access Point': Wifi
};

const LESSON_COLORS = {
  0: 'from-blue-400 to-blue-600',
  1: 'from-green-400 to-green-600', 
  2: 'from-purple-400 to-purple-600',
  3: 'from-orange-400 to-orange-600',
  4: 'from-pink-400 to-pink-600',
  5: 'from-indigo-400 to-indigo-600'
};

const DIFFICULTY_COLORS = {
  'easy': 'bg-green-500',
  'medium': 'bg-yellow-500',
  'hard': 'bg-red-500'
};

const GameMapReal: React.FC<GameMapRealProps> = ({ 
  topics, 
  progress, 
  isTopicUnlocked, 
  onSelectTopic 
}) => {
  const getTopicIcon = (title: string) => {
    const key = Object.keys(LESSON_ICONS).find(k => title.includes(k));
    return key ? LESSON_ICONS[key as keyof typeof LESSON_ICONS] : Book;
  };

  const getTopicProgress = (topicId: string) => {
    const topicProgress = progress[topicId];
    if (!topicProgress) return 0;
    return (topicProgress.score / topicProgress.max_score) * 100;
  };

  const getTotalProgress = () => {
    const completedTopics = Object.values(progress).filter(p => p.completed_at).length;
    return (completedTopics / topics.length) * 100;
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-16">
        <Book className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-2xl font-bold mb-2">لا توجد مواضيع متاحة</h3>
        <p className="text-muted-foreground">
          يبدو أنه لم يتم إضافة محتوى للصف الحادي عشر بعد
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">خريطة الشبكات التعليمية</h2>
        <p className="text-muted-foreground mb-4">
          استكشف دروس الصف الحادي عشر في أساسيات الاتصال
        </p>
        
        {/* Overall Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span>التقدم الإجمالي</span>
            <span>{Math.round(getTotalProgress())}%</span>
          </div>
          <Progress value={getTotalProgress()} className="mb-4" />
        </div>
      </div>

      {/* Network Topology Visualization */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-96 h-96 bg-primary/20 rounded-full" />
        </div>
        
        {/* Lessons Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => {
            const unlocked = isTopicUnlocked(index);
            const topicProgress = progress[topic.id];
            const completed = topicProgress?.completed_at != null;
            const progressPercent = getTopicProgress(topic.id);
            const TopicIcon = getTopicIcon(topic.title);
            const colorClass = LESSON_COLORS[index % 6 as keyof typeof LESSON_COLORS];

            return (
              <Card 
                key={topic.id}
                className={`
                  relative overflow-hidden transition-all duration-300 cursor-pointer
                  ${unlocked ? 'hover:scale-105 hover:shadow-lg' : 'opacity-50'}
                  ${completed ? 'ring-2 ring-green-500 shadow-lg' : ''}
                  ${!unlocked ? 'grayscale' : ''}
                `}
                onClick={() => unlocked && onSelectTopic(topic.id)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10`} />
                
                {/* Connection Lines (for network effect) */}
                {index > 0 && unlocked && (
                  <div className="absolute -top-3 left-1/2 w-0.5 h-6 bg-primary/30 transform -translate-x-1/2" />
                )}
                
                <CardContent className="p-6 relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`
                      w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} 
                      flex items-center justify-center
                    `}>
                      {unlocked ? (
                        <TopicIcon className="h-6 w-6 text-white" />
                      ) : (
                        <Lock className="h-6 w-6 text-white" />
                      )}
                    </div>
                    
                    {completed && (
                      <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        مكتمل
                      </Badge>
                    )}
                    
                    {topicProgress && !completed && (
                      <Badge variant="secondary">
                        {topicProgress.attempts} محاولة
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-lg mb-2">{topic.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {topic.lessons.length} {topic.lessons.length === 1 ? 'درس' : 'دروس'} • {topic.totalQuestions} {topic.totalQuestions === 1 ? 'سؤال' : 'أسئلة'}
                  </p>

                  {/* Section Info */}
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs">
                      {topic.section_title}
                    </Badge>
                  </div>

                  {/* Progress */}
                  {topicProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>التقدم</span>
                        <span>{topicProgress.score}/{topicProgress.max_score}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}

                  {/* Lessons List */}
                  {unlocked && topic.lessons.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-sm">الدروس:</h4>
                      <div className="flex flex-wrap gap-1">
                        {topic.lessons.slice(0, 3).map((lesson, lIndex) => (
                          <Badge 
                            key={lIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {lesson.title}
                          </Badge>
                        ))}
                        {topic.lessons.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{topic.lessons.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Questions Info */}
                  {unlocked && topic.questions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">مستويات الأسئلة:</h4>
                      <div className="flex flex-wrap gap-1">
                        {['easy', 'medium', 'hard'].map((level) => {
                          const count = topic.questions.filter(q => q.difficulty_level === level).length;
                          if (count === 0) return null;
                          return (
                            <Badge 
                              key={level}
                              className={`text-white text-xs ${
                                DIFFICULTY_COLORS[level as keyof typeof DIFFICULTY_COLORS]
                              }`}
                            >
                              {level === 'easy' ? 'سهل' : level === 'medium' ? 'متوسط' : 'صعب'}: {count}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-4">
                    {!unlocked ? (
                      <Button variant="outline" disabled className="w-full">
                        مقفل - أكمل الموضوع السابق
                      </Button>
                    ) : completed ? (
                      <Button variant="outline" className="w-full">
                        مراجعة الموضوع
                      </Button>
                    ) : (
                      <Button className="w-full">
                        {topicProgress ? 'متابعة التعلم' : 'ابدأ التعلم'}
                      </Button>
                    )}
                  </div>

                  {/* Network Node Effect */}
                  {completed && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Network Legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">دليل خريطة الشبكة:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>موضوع مكتمل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>موضوع متاح</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span>موضوع مقفل</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span>المرحلة النشطة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameMapReal;