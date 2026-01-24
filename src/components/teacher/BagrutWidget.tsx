import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const pendingCount = stats?.examsWithDetails.filter(e => e.pendingGrading > 0).length || 0;
  const gradedCount = stats?.examsWithDetails.filter(e => e.gradedCount > 0 && e.pendingGrading === 0).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            امتحانات البجروت
            <span className="text-sm font-normal text-muted-foreground">
              ({canAccessGrade11 && canAccessGrade12 
                ? 'الصف الحادي عشر والثاني عشر'
                : canAccessGrade11 
                ? 'الصف الحادي عشر'
                : 'الصف الثاني عشر'
              })
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </CardHeader>

        <CardContent>
          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* امتحانات متاحة */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-4 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">امتحانات متاحة</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats?.availableExams || 0}</p>
            </div>

            {/* طلاب متقدمين */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">طلاب متقدمين</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats?.studentsParticipated || 0}</p>
            </div>

            {/* بانتظار التصحيح */}
            <div className={cn(
              "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-4 rounded-lg border border-yellow-500/20",
              (stats?.pendingGrading || 0) > 0 && "ring-2 ring-yellow-500/30"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">بانتظار التصحيح</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pendingGrading || 0}</p>
            </div>

            {/* معدل العلامات */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">معدل العلامات</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats?.averageScore ? `${stats.averageScore}%` : '-'}
              </p>
            </div>
          </div>

          {/* أزرار الفلترة */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
            >
              الكل ({stats?.examsWithDetails.length || 0})
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pending')}
              className={activeTab !== 'pending' && pendingCount > 0 ? 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50' : ''}
            >
              <Clock className="w-3 h-3 ml-1" />
              بانتظار التصحيح ({pendingCount})
            </Button>
            <Button
              variant={activeTab === 'graded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('graded')}
              className={activeTab !== 'graded' && gradedCount > 0 ? 'border-green-500/50 text-green-600 hover:bg-green-50' : ''}
            >
              <CheckCircle className="w-3 h-3 ml-1" />
              مصححة ({gradedCount})
            </Button>
          </div>

          {/* قائمة الامتحانات */}
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
            <ScrollArea className="h-[280px]">
              <div className="space-y-3 pr-2">
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
    <div className="p-4 rounded-lg border hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{exam.title}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
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
          <span className="flex items-center gap-1 text-yellow-600 font-medium">
            <Clock className="h-3 w-3" />
            {exam.pendingGrading} بانتظار
          </span>
        )}
        {exam.gradedCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
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
          className="text-xs flex-1"
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
    { label: 'إجمالي المحاولات', value: exam.studentAttempts, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'بانتظار التصحيح', value: exam.pendingGrading, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-500/10', highlight: exam.pendingGrading > 0 },
    { label: 'تم التصحيح', value: exam.gradedCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'تم النشر', value: exam.publishedCount, icon: Award, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { label: 'معدل العلامات', value: exam.averageScore ? `${exam.averageScore}%` : '-', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-500/10' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            تفاصيل الامتحان
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات الامتحان */}
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-bold text-lg mb-2">{exam.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {exam.subject}
              </Badge>
              <Badge variant="secondary">
                {exam.exam_year} - {seasonLabels[exam.exam_season] || exam.exam_season}
              </Badge>
              {exam.available_for_grades.map(grade => (
                <Badge key={grade} variant="secondary">صف {grade}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{exam.total_points} علامة</span>
              <span>{exam.duration_minutes} دقيقة</span>
            </div>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-lg",
                  stat.bg,
                  stat.highlight && "ring-2 ring-yellow-500/30"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={cn("text-xl font-bold", stat.color)}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* زر التصحيح */}
          <Button
            className="w-full"
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
