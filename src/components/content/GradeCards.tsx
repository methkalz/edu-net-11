import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, BookOpen, Trophy, ArrowLeft, GamepadIcon, FileText, PlayCircle, Layers, Lock } from 'lucide-react';
import { useGradeStats } from '@/hooks/useGradeStats';
import { useAvailableGrades } from '@/hooks/useAvailableGrades';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useContentPermissions } from '@/hooks/useContentPermissions';

const GradeCards: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading } = useGradeStats();
  const { availableGrades, isGradeAvailable, loading: gradesLoading, error: gradesError } = useAvailableGrades();
  const { isManager, accessLevel } = useContentPermissions();

  const grades = [
    {
      id: 'grade-10',
      grade: '10',
      name: 'الصف العاشر',
      description: 'إدارة الفيديوهات التعليمية وملفات العمل',
      avatar: '/avatars/student-boy-1.png',
      gradeIcon: '🎯',
      features: [
        'رفع وإدارة مقاطع الفيديو',
        'ملفات الوورد للعمل عليها',
        'معاينة المحتوى للطلاب'
      ],
      icon: Video,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-700',
      path: '/grade10-management',
      stats: {
        videos: stats.grade10.videos,
        documents: stats.grade10.documents,
        total: stats.grade10.videos + stats.grade10.documents
      }
    },
    {
      id: 'grade-11',
      grade: '11',
      name: 'الصف الحادي عشر',
      description: 'إدارة الدروس النصية والاختبارات والألعاب التعليمية',
      avatar: '/avatars/student-girl-1.png',
      gradeIcon: '📚',
      features: [
        'دروس نصية منظمة في أقسام ومواضيع',
        'ألعاب تفاعلية ومسابقات',
        'اختبارات ومكتبة ملفات ومقاطع فيديو'
      ],
      icon: BookOpen,
      color: 'green',
      gradient: 'from-green-500 to-green-700',
      path: '/grade11-management',
      stats: {
        lessons: stats.grade11.lessons,
        games: stats.grade11.games,
        exams: stats.grade11.exams
      }
    },
    {
      id: 'grade-12',
      grade: '12',
      name: 'الصف الثاني عشر',
      description: 'إدارة المشاريع النهائية ومكتبة الملفات المساعدة',
      avatar: '/avatars/student-creative.png',
      gradeIcon: '🎓',
      features: [
        'مشاريع التخرج النهائية',
        'محرر المستندات المتقدم',
        'مكتبة الملفات المساعدة'
      ],
      icon: Trophy,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-700',
      path: '/grade12-management',
      stats: {
        documents: stats.grade12.documents,
        videos: stats.grade12.videos,
        total: stats.grade12.documents + stats.grade12.videos
      }
    }
  ];

  // عرض loading skeleton أثناء تحميل الصفوف المتاحة
  if (gradesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-[500px]">
            <CardHeader className="text-center pb-4">
              <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((k) => (
                    <div key={k} className="text-center">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // عرض رسالة خطأ إذا فشل تحميل الصفوف
  if (gradesError) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-4">خطأ في تحميل الصفوف المتاحة</div>
        <div className="text-sm text-muted-foreground">سيتم عرض جميع الصفوف كافتراضي</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {grades.map((grade) => {
          const IconComponent = grade.icon;
          const isAvailable = isGradeAvailable(grade.grade);
          const isDisabled = !isAvailable;
          
          const cardContent = (
            <Card 
              key={grade.id}
              className={`group transition-all duration-300 border-0 overflow-hidden relative ${
                isDisabled 
                  ? 'opacity-75 cursor-not-allowed bg-muted/30' 
                  : 'cursor-pointer hover:shadow-2xl hover:-translate-y-2'
              }`}
              onClick={() => isAvailable && navigate(grade.path)}
            >
              {/* خلفية متدرجة - رمادية للمغلق، ملونة للمتاح */}
              <div className={`absolute inset-0 ${
                isDisabled 
                  ? 'bg-gradient-to-br from-muted to-muted/50 opacity-30' 
                  : `bg-gradient-to-br ${grade.gradient} opacity-5 group-hover:opacity-10`
              } transition-opacity duration-300`} />
              
              {/* أيقونة القفل للصفوف غير المتاحة */}
              {isDisabled && (
                <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-sm border border-border/20">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              <CardHeader className="text-center pb-4 relative flex flex-col items-center">
                {/* Avatar Container */}
                <div className="relative mb-4">
                  <img
                    src={grade.avatar}
                    alt={grade.name}
                    className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-white"
                  />
                  
                  {/* Grade Icon Overlay */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-lg border-2 border-gray-100">
                    {grade.gradeIcon}
                  </div>
                  
                  {/* Grade Number Badge */}
                  <div className={`absolute -bottom-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                    isDisabled 
                      ? 'bg-gradient-to-br from-muted-foreground to-muted-foreground/80' 
                      : `bg-gradient-to-br ${grade.gradient}`
                  }`}>
                    {grade.grade}
                  </div>
                </div>
                
                <CardTitle className={`text-2xl font-bold mb-2 ${
                  isDisabled ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {grade.name}
                </CardTitle>
                
                <p className={`text-center leading-relaxed ${
                  isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'
                }`}>
                  {grade.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6 relative">
                {/* المميزات */}
                <div className="space-y-3">
                  <h4 className={`font-semibold ${
                    isDisabled ? 'text-muted-foreground' : 'text-foreground'
                  }`}>المميزات الرئيسية:</h4>
                  <ul className="space-y-2">
                    {grade.features.map((feature, index) => (
                      <li key={index} className={`flex items-center gap-3 text-sm ${
                        isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isDisabled 
                            ? 'bg-muted-foreground/40' 
                            : `bg-gradient-to-r ${grade.gradient}`
                        }`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

              {/* الإحصائيات */}
              <div className="pt-4 border-t border-border/50">
                {loading ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-6 w-full mb-2" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(grade.stats).map(([key, value]) => (
                      <div key={key} className="text-center flex flex-col items-center justify-center p-2">
                        <div className={`text-2xl font-bold mb-1 ${
                          isDisabled 
                            ? 'text-muted-foreground' 
                            : `bg-gradient-to-r ${grade.gradient} bg-clip-text text-transparent`
                        }`}>
                          {value}
                        </div>
                        <div className={`text-xs flex items-center justify-center gap-1 ${
                          isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {key === 'videos' && <><PlayCircle className="h-3 w-3" />فيديو</>}
                          {key === 'documents' && <><FileText className="h-3 w-3" />مستند</>}
                          {key === 'lessons' && <><BookOpen className="h-3 w-3" />درس</>}
                          {key === 'sections' && <><Layers className="h-3 w-3" />قسم</>}
                          {key === 'games' && <><GamepadIcon className="h-3 w-3" />لعبة</>}
                          {key === 'exams' && <><Trophy className="h-3 w-3" />اختبار</>}
                          {key === 'total' && <><Layers className="h-3 w-3" />إجمالي</>}
                          {key === 'projects' && 'مشروع'}
                          {key === 'library' && 'ملف'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* زر الدخول */}
              <div className="pt-4">
                <div className={`w-full rounded-lg p-3 text-center font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  isDisabled 
                    ? 'bg-muted text-muted-foreground border border-border/30' 
                    : `bg-gradient-to-r ${grade.gradient} text-white group-hover:shadow-lg`
                }`}>
                  <span>{isDisabled ? 'غير متاح' : 
                    isManager ? 'إدارة المحتوى' : 
                    accessLevel === 'REVIEW' ? 'مراجعة المحتوى' :
                    accessLevel === 'CUSTOM' ? 'استعراض المحتوى' :
                    'مشاهدة المحتوى'}</span>
                  {isDisabled ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );

          // إذا كان الصف غير متاح، عرض tooltip توضيحي
          if (isDisabled) {
            return (
              <Tooltip key={grade.id}>
                <TooltipTrigger asChild>
                  {cardContent}
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-center">
                    هذا الصف غير متاح في باقتك الحالية.
                    <br />
                    تواصل مع الإدارة لترقية الباقة.
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return cardContent;
        })}
      </div>
    </TooltipProvider>
  );
};

export default GradeCards;