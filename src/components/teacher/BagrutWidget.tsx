import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  GraduationCap,
  FileText,
  Award,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeacherBagrutStats, BagrutExamForTeacher } from '@/hooks/useTeacherBagrutStats';

interface BagrutWidgetProps {
  canAccessGrade11: boolean;
  canAccessGrade12: boolean;
}

// ترجمة موسم الامتحان
const seasonLabels: Record<string, string> = {
  winter: 'شتوي',
  summer: 'صيفي',
  spring: 'ربيعي',
  fall: 'خريفي',
};

export const BagrutWidget: React.FC<BagrutWidgetProps> = ({
  canAccessGrade11,
  canAccessGrade12,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedExam, setSelectedExam] = useState<BagrutExamForTeacher | null>(null);
  
  const { data: stats, isLoading, refetch, isRefetching } = useTeacherBagrutStats({
    canAccessGrade11,
    canAccessGrade12,
  });

  // تصفية الامتحانات حسب التبويب
  const filteredExams = React.useMemo(() => {
    if (!stats?.examsWithDetails) return [];
    
    switch (activeTab) {
      case 'pending':
        return stats.examsWithDetails.filter(e => e.pendingGrading > 0);
      case 'graded':
        return stats.examsWithDetails.filter(e => e.gradedCount > 0 && e.pendingGrading === 0);
      default:
        return stats.examsWithDetails;
    }
  }, [stats?.examsWithDetails, activeTab]);

  // بطاقات الإحصائيات
  const statCards = [
    {
      title: 'امتحانات متاحة',
      value: stats?.availableExams || 0,
      icon: BookOpen,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-500/10 to-amber-500/10',
    },
    {
      title: 'طلاب متقدمين',
      value: stats?.studentsParticipated || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      title: 'بانتظار التصحيح',
      value: stats?.pendingGrading || 0,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-500/10 to-orange-500/10',
      highlight: (stats?.pendingGrading || 0) > 0,
    },
    {
      title: 'معدل العلامات',
      value: stats?.averageScore ? `${stats.averageScore}%` : '-',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
    },
  ];

  if (isLoading) {
    return (
      <Card className="border-orange-200/50 dark:border-orange-800/30">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-orange-200/50 dark:border-orange-800/30 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/5 to-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">امتحانات البجروت</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canAccessGrade11 && canAccessGrade12 
                    ? 'الصف الحادي عشر والثاني عشر'
                    : canAccessGrade11 
                    ? 'الصف الحادي عشر'
                    : 'الصف الثاني عشر'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative p-3 rounded-xl transition-all duration-300",
                  `bg-gradient-to-br ${stat.bgGradient}`,
                  stat.highlight && "ring-2 ring-yellow-500/50 animate-pulse"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={cn(
                    "h-4 w-4",
                    `bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`
                  )} style={{ color: stat.gradient.includes('orange') ? '#f97316' : stat.gradient.includes('blue') ? '#3b82f6' : stat.gradient.includes('yellow') ? '#eab308' : '#22c55e' }} />
                  <span className="text-xs text-muted-foreground">{stat.title}</span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  `bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`
                )} style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* تبويبات الامتحانات */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="w-full grid grid-cols-3 mb-3">
              <TabsTrigger value="all" className="text-xs">
                الكل ({stats?.examsWithDetails.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                بانتظار التصحيح ({stats?.examsWithDetails.filter(e => e.pendingGrading > 0).length || 0})
              </TabsTrigger>
              <TabsTrigger value="graded" className="text-xs">
                مصححة ({stats?.examsWithDetails.filter(e => e.gradedCount > 0 && e.pendingGrading === 0).length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredExams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {activeTab === 'pending' 
                      ? 'لا توجد محاولات بانتظار التصحيح'
                      : activeTab === 'graded'
                      ? 'لا توجد امتحانات مصححة بعد'
                      : 'لا توجد امتحانات بجروت متاحة حالياً'
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-3">
                    {filteredExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onViewDetails={() => setSelectedExam(exam)}
                        onGrade={() => navigate(`/bagrut-grading/${exam.id}`)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog تفاصيل الامتحان */}
      <ExamDetailsDialog
        exam={selectedExam}
        open={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        onGrade={(examId) => {
          setSelectedExam(null);
          navigate(`/bagrut-grading/${examId}`);
        }}
      />
    </>
  );
};

// مكون بطاقة الامتحان
interface ExamCardProps {
  exam: BagrutExamForTeacher;
  onViewDetails: () => void;
  onGrade: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onViewDetails, onGrade }) => {
  const hasPending = exam.pendingGrading > 0;
  
  return (
    <div className={cn(
      "p-3 rounded-xl border transition-all duration-200 hover:shadow-md",
      hasPending 
        ? "border-yellow-300/50 bg-yellow-50/30 dark:bg-yellow-900/10" 
        : "border-border/50 bg-card/50"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{exam.title}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs bg-orange-100/50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              {exam.subject}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {exam.exam_year} • {seasonLabels[exam.exam_season] || exam.exam_season}
            </span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {exam.available_for_grades.map(grade => (
            <Badge key={grade} variant="secondary" className="text-xs">
              صف {grade}
            </Badge>
          ))}
        </div>
      </div>

      {/* إحصائيات المحاولات */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {exam.studentAttempts} محاولة
        </span>
        {hasPending && (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
            <Clock className="h-3 w-3" />
            {exam.pendingGrading} بانتظار
          </span>
        )}
        {exam.gradedCount > 0 && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            {exam.gradedCount} مصحح
          </span>
        )}
        {exam.averageScore !== null && (
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            معدل: {exam.averageScore}%
          </span>
        )}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs flex-1"
          onClick={onViewDetails}
        >
          <FileText className="h-3 w-3 ml-1" />
          التفاصيل
        </Button>
        <Button
          variant={hasPending ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-xs flex-1",
            hasPending && "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          )}
          onClick={onGrade}
        >
          {hasPending ? (
            <>
              <Clock className="h-3 w-3 ml-1" />
              تصحيح ({exam.pendingGrading})
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 ml-1" />
              عرض النتائج
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Dialog تفاصيل الامتحان
interface ExamDetailsDialogProps {
  exam: BagrutExamForTeacher | null;
  open: boolean;
  onClose: () => void;
  onGrade: (examId: string) => void;
}

const ExamDetailsDialog: React.FC<ExamDetailsDialogProps> = ({
  exam,
  open,
  onClose,
  onGrade,
}) => {
  if (!exam) return null;

  const stats = [
    { label: 'إجمالي المحاولات', value: exam.studentAttempts, icon: Users },
    { label: 'بانتظار التصحيح', value: exam.pendingGrading, icon: Clock, highlight: exam.pendingGrading > 0 },
    { label: 'تم التصحيح', value: exam.gradedCount, icon: CheckCircle },
    { label: 'تم النشر', value: exam.publishedCount, icon: Award },
    { label: 'معدل العلامات', value: exam.averageScore ? `${exam.averageScore}%` : '-', icon: BarChart3 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-orange-500" />
            تفاصيل الامتحان
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات الامتحان */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10">
            <h3 className="font-bold text-lg mb-2">{exam.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-300">
                {exam.subject}
              </Badge>
              <Badge variant="outline">
                {exam.exam_year} - {seasonLabels[exam.exam_season] || exam.exam_season}
              </Badge>
              {exam.available_for_grades.map(grade => (
                <Badge key={grade} variant="secondary">صف {grade}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{exam.total_points} نقطة</span>
              <span>{exam.duration_minutes} دقيقة</span>
            </div>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-lg border",
                  stat.highlight && "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                )}
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <stat.icon className="h-4 w-4" />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  stat.highlight && "text-yellow-600 dark:text-yellow-400"
                )}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* زر التصحيح */}
          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            onClick={() => onGrade(exam.id)}
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {exam.pendingGrading > 0 
              ? `تصحيح المحاولات (${exam.pendingGrading} بانتظار)`
              : 'عرض النتائج والتصحيح'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BagrutWidget;
