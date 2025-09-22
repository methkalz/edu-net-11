import React from 'react';
import { MapPin, Lock, CheckCircle, Star, Book, Network, Server, Users, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameLesson, PlayerProgress } from '@/hooks/useGrade11Game';

interface GameMapRealProps {
  lessons: GameLesson[];
  progress: Record<string, PlayerProgress>;
  isLessonUnlocked: (index: number) => boolean;
  onSelectLesson: (lessonId: string) => void;
}

const LESSON_ICONS = {
  'مضيف': Server,
  'شبكة عميل': Network,
  'شبكة نظير': Users,
  'أجهزة طرفية': Star,
  'أجهزة وسيطة': Wifi,
  'وسائط الشبكة': Network
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
  lessons, 
  progress, 
  isLessonUnlocked, 
  onSelectLesson 
}) => {
  const getLessonIcon = (title: string) => {
    const key = Object.keys(LESSON_ICONS).find(k => title.includes(k));
    return key ? LESSON_ICONS[key as keyof typeof LESSON_ICONS] : Book;
  };

  const getLessonProgress = (lessonId: string) => {
    const lessonProgress = progress[lessonId];
    if (!lessonProgress) return 0;
    return (lessonProgress.score / lessonProgress.max_score) * 100;
  };

  const getTotalProgress = () => {
    const completedLessons = Object.values(progress).filter(p => p.completed_at).length;
    return (completedLessons / lessons.length) * 100;
  };

  if (lessons.length === 0) {
    return (
      <div className="text-center py-16">
        <Book className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-2xl font-bold mb-2">لا توجد دروس متاحة</h3>
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
          {lessons.map((lesson, index) => {
            const unlocked = isLessonUnlocked(index);
            const lessonProgress = progress[lesson.id];
            const completed = lessonProgress?.completed_at != null;
            const progressPercent = getLessonProgress(lesson.id);
            const LessonIcon = getLessonIcon(lesson.title);
            const colorClass = LESSON_COLORS[index % 6 as keyof typeof LESSON_COLORS];

            return (
              <Card 
                key={lesson.id}
                className={`
                  relative overflow-hidden transition-all duration-300 cursor-pointer
                  ${unlocked ? 'hover:scale-105 hover:shadow-lg' : 'opacity-50'}
                  ${completed ? 'ring-2 ring-green-500 shadow-lg' : ''}
                  ${!unlocked ? 'grayscale' : ''}
                `}
                onClick={() => unlocked && onSelectLesson(lesson.id)}
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
                        <LessonIcon className="h-6 w-6 text-white" />
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
                    
                    {lessonProgress && !completed && (
                      <Badge variant="secondary">
                        {lessonProgress.attempts} محاولة
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-lg mb-2">{lesson.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {lesson.content?.substring(0, 100)}...
                  </p>

                  {/* Section Info */}
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs">
                      {lesson.section_title}
                    </Badge>
                  </div>

                  {/* Progress */}
                  {lessonProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>التقدم</span>
                        <span>{lessonProgress.score}/{lessonProgress.max_score}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}

                  {/* Questions Info */}
                  {unlocked && lesson.questions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">الأسئلة المتاحة:</h4>
                      <div className="flex flex-wrap gap-1">
                        {lesson.questions.slice(0, 3).map((question, qIndex) => (
                          <Badge 
                            key={qIndex}
                            className={`text-white text-xs ${
                              DIFFICULTY_COLORS[question.difficulty_level as keyof typeof DIFFICULTY_COLORS]
                            }`}
                          >
                            {question.difficulty_level}
                          </Badge>
                        ))}
                        {lesson.questions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{lesson.questions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-4">
                    {!unlocked ? (
                      <Button variant="outline" disabled className="w-full">
                        مقفل - أكمل الدرس السابق
                      </Button>
                    ) : completed ? (
                      <Button variant="outline" className="w-full">
                        مراجعة الدرس
                      </Button>
                    ) : (
                      <Button className="w-full">
                        {lessonProgress ? 'متابعة التعلم' : 'ابدأ التعلم'}
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
              <span>درس مكتمل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>درس متاح</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span>درس مقفل</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span>العقدة النشطة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameMapReal;