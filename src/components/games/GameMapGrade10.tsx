import React from 'react';
import { MapPin, Lock, CheckCircle, Star, Book, Network, Server, Users, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameLesson, PlayerProgress } from '@/hooks/useGrade10Game';

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

interface GameMapGrade10Props {
  lessons: GameLesson[];
  progress: Record<string, PlayerProgress>;
  isLessonUnlocked: (index: number) => boolean;
  onSelectLesson: (lessonId: string) => void;
}

const LESSON_ICONS: Record<string, any> = {
  'مضيف': Server,
  'شبكة عميل': Network,
  'شبكة نظير': Users,
  'أجهزة طرفية': Star,
  'أجهزة وسيطة': Wifi,
  'وسائط الشبكة': Network
};

const LESSON_COLORS: Record<number, string> = {
  0: 'from-blue-400 to-blue-600',
  1: 'from-green-400 to-green-600',
  2: 'from-purple-400 to-purple-600',
  3: 'from-orange-400 to-orange-600',
  4: 'from-pink-400 to-pink-600',
  5: 'from-indigo-400 to-indigo-600'
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500'
};

const GameMapGrade10: React.FC<GameMapGrade10Props> = ({ lessons, progress, isLessonUnlocked, onSelectLesson }) => {
  const getLessonIcon = (title: string) => {
    const key = Object.keys(LESSON_ICONS).find(k => title.includes(k));
    return key ? LESSON_ICONS[key] : Book;
  };

  const getLessonProgress = (lessonId: string) => {
    const lp = progress[lessonId];
    if (!lp) return 0;
    return (lp.score / lp.max_score) * 100;
  };

  const getTotalProgress = () => {
    const completed = Object.values(progress).filter(p => p.completed_at).length;
    return lessons.length === 0 ? 0 : (completed / lessons.length) * 100;
  };

  if (lessons.length === 0) {
    return (
      <div className="text-center py-16">
        <Book className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-2xl font-bold mb-2">لا توجد دروس متاحة</h3>
        <p className="text-muted-foreground">يبدو أنه لم يتم إضافة محتوى للصف العاشر بعد</p>
      </div>
    );
  }

  // Group lessons by section for visual hierarchy
  const groupedBySection: { section_title: string; section_order: number; lessons: { lesson: GameLesson; globalIndex: number }[] }[] = [];
  lessons.forEach((lesson, globalIndex) => {
    let group = groupedBySection.find(g => g.section_title === lesson.section_title);
    if (!group) {
      group = { section_title: lesson.section_title, section_order: lesson.section_order, lessons: [] };
      groupedBySection.push(group);
    }
    group.lessons.push({ lesson, globalIndex });
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">خريطة الشبكات التعليمية — الصف العاشر</h2>
        <p className="text-muted-foreground mb-4">استكشف دروس الصف العاشر في أساسيات الاتصال</p>
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span>التقدم الإجمالي</span>
            <span>{Math.round(getTotalProgress())}%</span>
          </div>
          <Progress value={getTotalProgress()} className="mb-4" />
        </div>
      </div>

      {groupedBySection.map(group => (
        <div key={group.section_title} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <Badge variant="outline" className="text-base px-4 py-1">{group.section_title}</Badge>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.lessons.map(({ lesson, globalIndex }) => {
              const unlocked = isLessonUnlocked(globalIndex);
              const lessonProgress = progress[lesson.id];
              const completed = lessonProgress?.completed_at != null;
              const progressPercent = getLessonProgress(lesson.id);
              const LessonIcon = getLessonIcon(lesson.title);
              const colorClass = LESSON_COLORS[globalIndex % 6];

              return (
                <Card
                  key={lesson.id}
                  className={`relative overflow-hidden transition-all duration-300 cursor-pointer
                    ${unlocked ? 'hover:scale-105 hover:shadow-lg' : 'opacity-50'}
                    ${completed ? 'ring-2 ring-green-500 shadow-lg' : ''}
                    ${!unlocked ? 'grayscale' : ''}`}
                  onClick={() => unlocked && onSelectLesson(lesson.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10`} />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                        {unlocked ? <LessonIcon className="h-6 w-6 text-white" /> : <Lock className="h-6 w-6 text-white" />}
                      </div>
                      {completed && (
                        <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> مكتمل
                        </Badge>
                      )}
                      {lessonProgress && !completed && (
                        <Badge variant="secondary">{lessonProgress.attempts} محاولة</Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-lg mb-2">{lesson.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {stripHtml(lesson.content || '').substring(0, 100)}...
                    </p>

                    <div className="mb-4">
                      <Badge variant="outline" className="text-xs">{lesson.topic_title}</Badge>
                    </div>

                    {lessonProgress && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>التقدم</span>
                          <span>{lessonProgress.score}/{lessonProgress.max_score}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    {unlocked && lesson.questions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">الأسئلة المتاحة:</h4>
                        <div className="flex flex-wrap gap-1">
                          {lesson.questions.slice(0, 3).map((q, i) => (
                            <Badge key={i} className={`text-white text-xs ${DIFFICULTY_COLORS[q.difficulty_level]}`}>
                              {q.difficulty_level}
                            </Badge>
                          ))}
                          {lesson.questions.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{lesson.questions.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      {!unlocked ? (
                        <Button variant="outline" disabled className="w-full">مقفل - أكمل الدرس السابق</Button>
                      ) : completed ? (
                        <Button variant="outline" className="w-full">مراجعة الدرس</Button>
                      ) : (
                        <Button className="w-full">{lessonProgress ? 'متابعة التعلم' : 'ابدأ التعلم'}</Button>
                      )}
                    </div>

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
      ))}

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">دليل الخريطة:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span>درس مكتمل</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>درس متاح</span></div>
            <div className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground" /><span>درس مقفل</span></div>
            <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /><span>المرحلة النشطة</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameMapGrade10;
