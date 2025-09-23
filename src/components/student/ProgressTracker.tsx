import React, { useState, useEffect } from 'react';
import { Trophy, Target, Clock, Star, BookOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Grade11SectionWithTopics } from '@/hooks/useGrade11Content';

interface ProgressTrackerProps {
  sections: Grade11SectionWithTopics[];
  completedLessons?: string[];
  studyTime?: number; // بالدقائق
  onUpdateProgress?: (lessonId: string, timeSpent: number) => void;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalSections: number;
  completedSections: number;
  totalTopics: number;
  completedTopics: number;
  studyStreak: number;
  totalStudyTime: number;
  averageTimePerLesson: number;
  completionPercentage: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  sections,
  completedLessons = [],
  studyTime = 0,
  onUpdateProgress
}) => {
  const [stats, setStats] = useState<ProgressStats>({
    totalLessons: 0,
    completedLessons: 0,
    totalSections: 0,
    completedSections: 0,
    totalTopics: 0,
    completedTopics: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    averageTimePerLesson: 0,
    completionPercentage: 0
  });

  const [achievements, setAchievements] = useState<string[]>([]);

  // حساب الإحصائيات
  useEffect(() => {
    const allTopics = sections.flatMap(section => section.topics);
    const allLessons = allTopics.flatMap(topic => topic.lessons);
    
    const totalLessons = allLessons.length;
    const completedCount = completedLessons.length;
    const completionPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    // حساب المواضيع المكتملة
    const completedTopics = allTopics.filter(topic => 
      topic.lessons.every(lesson => completedLessons.includes(lesson.id))
    ).length;

    // حساب الأقسام المكتملة
    const completedSections = sections.filter(section =>
      section.topics.every(topic => 
        topic.lessons.every(lesson => completedLessons.includes(lesson.id))
      )
    ).length;

    const averageTime = completedCount > 0 ? studyTime / completedCount : 0;

    setStats({
      totalLessons,
      completedLessons: completedCount,
      totalSections: sections.length,
      completedSections,
      totalTopics: allTopics.length,
      completedTopics,
      studyStreak: calculateStreak(),
      totalStudyTime: studyTime,
      averageTimePerLesson: averageTime,
      completionPercentage
    });

    // تحديث الإنجازات
    updateAchievements(completionPercentage, completedCount, studyTime);
  }, [sections, completedLessons, studyTime]);

  const calculateStreak = () => {
    // منطق بسيط لحساب الخط المتتالي (يمكن تحسينه لاحقاً)
    return Math.floor(completedLessons.length / 5);
  };

  const updateAchievements = (completion: number, lessons: number, time: number) => {
    const newAchievements: string[] = [];

    if (lessons >= 5) newAchievements.push('first_steps');
    if (lessons >= 10) newAchievements.push('steady_learner');
    if (lessons >= 25) newAchievements.push('dedicated_student');
    if (completion >= 25) newAchievements.push('quarter_complete');
    if (completion >= 50) newAchievements.push('halfway_there');
    if (completion >= 75) newAchievements.push('almost_done');
    if (completion >= 100) newAchievements.push('course_master');
    if (time >= 300) newAchievements.push('time_invested'); // 5 ساعات
    if (stats.studyStreak >= 3) newAchievements.push('streak_master');

    setAchievements(newAchievements);
  };

  const getAchievementLabel = (achievementId: string) => {
    const labels: Record<string, string> = {
      first_steps: 'الخطوات الأولى',
      steady_learner: 'متعلم مثابر',
      dedicated_student: 'طالب مجتهد',
      quarter_complete: 'ربع الطريق',
      halfway_there: 'نصف الطريق',
      almost_done: 'على وشك الانتهاء',
      course_master: 'سيد المنهج',
      time_invested: 'استثمار الوقت',
      streak_master: 'سيد التتابع'
    };
    return labels[achievementId] || achievementId;
  };

  return (
    <div className="space-y-6">
      {/* نظرة عامة */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            تقدمك في المنهج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-medium text-gray-700">الإنجاز الإجمالي</span>
            <span className="text-2xl font-bold text-blue-600">
              {Math.round(stats.completionPercentage)}%
            </span>
          </div>
          <Progress value={stats.completionPercentage} className="h-4" />
          <div className="flex items-center justify-between text-base text-gray-600">
            <span>أكملت {stats.completedLessons} من أصل {stats.totalLessons} درس</span>
            <span>{stats.totalLessons - stats.completedLessons} درس متبقي</span>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات التفصيلية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* الدروس */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.completedLessons}</p>
                <p className="text-lg text-gray-600">درس مكتمل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الوقت المستغرق */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.floor(stats.totalStudyTime / 60)}
                </p>
                <p className="text-lg text-gray-600">ساعة دراسة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الخط المتتالي */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.studyStreak}</p>
                <p className="text-lg text-gray-600">خط متتالي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإنجازات */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              إنجازاتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {achievements.map((achievement) => (
                <Badge
                  key={achievement}
                  variant="secondary"
                  className="px-4 py-2 text-base bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  <Star className="h-4 w-4 mr-2" />
                  {getAchievementLabel(achievement)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* تفاصيل التقدم بالأقسام */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">التقدم بالأقسام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => {
            const sectionLessons = section.topics.flatMap(topic => topic.lessons);
            const sectionCompleted = sectionLessons.filter(lesson => 
              completedLessons.includes(lesson.id)
            ).length;
            const sectionProgress = sectionLessons.length > 0 
              ? (sectionCompleted / sectionLessons.length) * 100 
              : 0;

            return (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{section.title}</span>
                  <span className="text-sm font-bold text-blue-600">
                    {Math.round(sectionProgress)}%
                  </span>
                </div>
                <Progress value={sectionProgress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{sectionCompleted} من {sectionLessons.length} درس</span>
                  <span>{section.topics.length} موضوع</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;