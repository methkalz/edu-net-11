import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Star, 
  Clock, 
  Search,
  Trophy,
  Target,
  TrendingUp,
  Users,
  PlayCircle,
  FileText,
  Image,
  Code,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';
import { useStudentGrade11Content, type StudentGrade11Lesson } from '@/hooks/useStudentGrade11Content';
import { StudentGrade11LessonViewer } from './StudentGrade11LessonViewer';

export const StudentGrade11Content: React.FC = () => {
  const { 
    sections, 
    loading, 
    error, 
    completeLesson, 
    updateLessonProgress, 
    getStatistics 
  } = useStudentGrade11Content();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<StudentGrade11Lesson | null>(null);
  const [isLessonViewerOpen, setIsLessonViewerOpen] = useState(false);

  const stats = getStatistics;

  // Filter sections based on search
  const filteredSections = sections.map(section => ({
    ...section,
    topics: section.topics.filter(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.lessons.some(lesson => lesson.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(section => section.topics.length > 0);

  const handleLessonClick = (lesson: StudentGrade11Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonViewerOpen(true);
  };

  const handleLessonComplete = (lessonId: string, timeSpent: number) => {
    completeLesson(lessonId, timeSpent);
  };

  const handleProgressUpdate = (lessonId: string, progress: number, timeSpent: number) => {
    updateLessonProgress(lessonId, progress, timeSpent);
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <PlayCircle className="h-4 w-4" />;
      case 'lottie':
        return <Play className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero Section Skeleton */}
        <Card className="border-2 border-dashed">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">حدث خطأ في تحميل المحتوى</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section with Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-primary/20">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  محتوى الصف الحادي عشر
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  استكشف دروسك التفاعلية واكتسب النقاط من خلال إكمال المحتوى التعليمي المتنوع
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.completedLessons}</div>
                  <div className="text-sm text-muted-foreground">دروس مكتملة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
                  <div className="text-sm text-muted-foreground">النقاط المكتسبة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.overallProgress}%</div>
                  <div className="text-sm text-muted-foreground">التقدم الإجمالي</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalSections}</div>
                  <div className="text-sm text-muted-foreground">الأقسام</div>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">التقدم الإجمالي</span>
                  <span className={`font-bold ${getProgressColor(stats.overallProgress)}`}>
                    {stats.overallProgress}%
                  </span>
                </div>
                <Progress value={stats.overallProgress} className="h-3" />
              </div>
            </div>

            {/* Achievement Panel */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  إنجازاتك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">الدروس المكتملة</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.completedLessons}/{stats.totalLessons}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">النقاط الكلية</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    {stats.totalPoints}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">الوقت المنقضي</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.floor(stats.totalTimeSpent / 60)} د
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الدروس والمواضيع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Content */}
      <div className="space-y-6">
        {filteredSections.length === 0 ? (
          <Card className="text-center p-12">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground">جرب تغيير مصطلحات البحث</p>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {filteredSections.map((section, sectionIndex) => (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="border rounded-xl bg-card shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full text-right">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                        {sectionIndex + 1}
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                        )}
                        {section.progress && (
                          <div className="flex items-center gap-3 mt-2">
                            <Progress value={section.progress.progress_percentage} className="h-2 w-32" />
                            <span className={`text-sm font-medium ${getProgressColor(section.progress.progress_percentage)}`}>
                              {section.progress.progress_percentage}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {section.topics.length} موضوع
                      </Badge>
                      {section.progress && section.progress.completed_lessons === section.progress.total_lessons && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          مكتمل
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {section.topics.map((topic, topicIndex) => (
                      <Card key={topic.id} className="border-r-4 border-r-primary/30 hover:border-r-primary/60 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-3">
                              <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                                {topicIndex + 1}
                              </span>
                              {topic.title}
                            </CardTitle>
                            {topic.progress && (
                              <div className="flex items-center gap-2">
                                <Progress value={topic.progress.progress_percentage} className="h-2 w-24" />
                                <span className={`text-sm font-medium ${getProgressColor(topic.progress.progress_percentage)}`}>
                                  {topic.progress.progress_percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                          {topic.content && (
                            <p className="text-sm text-muted-foreground mt-2">{topic.content}</p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {topic.lessons.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-6 bg-muted/30 rounded-lg">
                              لا توجد دروس في هذا الموضوع
                            </p>
                          ) : (
                            <div className="grid gap-3">
                              {topic.lessons.map((lesson, lessonIndex) => {
                                const progress = lesson.progress?.progress_percentage || 0;
                                const isCompleted = progress >= 100;
                                
                                return (
                                  <div
                                    key={lesson.id}
                                    onClick={() => handleLessonClick(lesson)}
                                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-all group hover:shadow-md"
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      isCompleted 
                                        ? 'bg-green-100 text-green-700' 
                                        : progress > 0 
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {isCompleted ? '✓' : lessonIndex + 1}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                          {lesson.title}
                                        </h4>
                                        {isCompleted && (
                                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                            مكتمل
                                          </Badge>
                                        )}
                                        {lesson.progress?.points_earned && (
                                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                            <Star className="h-2 w-2 mr-1" />
                                            {lesson.progress.points_earned}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          <span>{lesson.estimated_duration} دقيقة</span>
                                        </div>
                                        
                                        {lesson.media && lesson.media.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            {lesson.media.slice(0, 3).map((media) => (
                                              <span key={media.id} className="text-muted-foreground">
                                                {getMediaIcon(media.media_type)}
                                              </span>
                                            ))}
                                            {lesson.media.length > 3 && (
                                              <span className="text-xs text-muted-foreground">
                                                +{lesson.media.length - 3}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        
                                        {progress > 0 && (
                                          <div className="flex items-center gap-2">
                                            <Progress value={progress} className="h-1 w-16" />
                                            <span className={`text-xs font-medium ${getProgressColor(progress)}`}>
                                              {progress}%
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Lesson Viewer Modal */}
      <StudentGrade11LessonViewer
        lesson={selectedLesson}
        isOpen={isLessonViewerOpen}
        onClose={() => {
          setIsLessonViewerOpen(false);
          setSelectedLesson(null);
        }}
        onComplete={handleLessonComplete}
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
};