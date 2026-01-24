import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeacherBagrutStats, BagrutExamForTeacher } from '@/hooks/useTeacherBagrutStats';
import {
  GraduationCap,
  Users,
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle,
  ArrowLeft,
  Eye,
} from 'lucide-react';

interface BagrutWidgetProps {
  canAccessGrade11: boolean;
  canAccessGrade12: boolean;
}

const seasonLabels: Record<string, string> = {
  winter: 'شتوي',
  summer: 'صيفي',
  spring: 'ربيعي',
  fall: 'خريفي',
  moed_a: 'موعد أ',
  moed_b: 'موعد ب',
  moed_c: 'موعد ג',
  special: 'موعد خاص',
};

interface ExamCardProps {
  exam: BagrutExamForTeacher;
  onView: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onView }) => {
  const hasPending = exam.pendingGrading > 0;
  
  return (
    <div className="p-3 rounded-lg border hover:bg-muted/30 transition-all group">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-orange-600 transition-colors">
            {exam.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{exam.exam_year} • {seasonLabels[exam.exam_season] || exam.exam_season}</span>
            <span>•</span>
            <span>{exam.studentAttempts} محاولة</span>
            {hasPending && (
              <Badge variant="secondary" className="text-yellow-600 bg-yellow-100 h-5 text-xs px-1.5">
                {exam.pendingGrading} بانتظار
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant={hasPending ? "default" : "ghost"}
          size="sm"
          className={`h-7 px-2 text-xs shrink-0 ${hasPending ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          onClick={onView}
        >
          {hasPending ? (
            <>
              <Clock className="h-3 w-3 ml-1" />
              تصحيح
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 ml-1" />
              عرض
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const BagrutWidget: React.FC<BagrutWidgetProps> = ({ canAccessGrade11, canAccessGrade12 }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'graded'>('all');
  
  const { data: stats, isLoading, error } = useTeacherBagrutStats({
    canAccessGrade11,
    canAccessGrade12,
  });

  if (!canAccessGrade11 && !canAccessGrade12) {
    return null;
  }

  const filteredExams = stats?.examsWithDetails.filter(exam => {
    if (activeTab === 'pending') return exam.pendingGrading > 0;
    if (activeTab === 'graded') return exam.gradedCount > 0 && exam.pendingGrading === 0;
    return true;
  }) || [];

  const pendingCount = stats?.examsWithDetails.filter(e => e.pendingGrading > 0).length || 0;
  const gradedOnlyCount = stats?.examsWithDetails.filter(e => e.gradedCount > 0 && e.pendingGrading === 0).length || 0;

  // عرض آخر 5 امتحانات فقط
  const displayedExams = filteredExams.slice(0, 5);
  const hasMore = filteredExams.length > 5;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            امتحانات البجروت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">حدث خطأ في تحميل البيانات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-500" />
            امتحانات البجروت
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-orange-600"
            onClick={() => navigate('/teacher/bagrut-exams')}
          >
            عرض الكل
            <ArrowLeft className="h-3 w-3 mr-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-3 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">امتحانات متاحة</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{stats?.availableExams || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-3 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">طلاب مشاركين</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{stats?.studentsParticipated || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-3 rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">بانتظار التصحيح</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">{stats?.pendingGrading || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-3 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">معدل العلامات</span>
            </div>
            <p className="text-xl font-bold text-green-600">{stats?.averageScore || 0}%</p>
          </div>
        </div>

        {/* أزرار الفلترة */}
        <div className="flex gap-2 flex-wrap">
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
            className={activeTab !== 'pending' && pendingCount > 0 ? 'border-yellow-500/50 text-yellow-600' : ''}
          >
            بانتظار التصحيح ({pendingCount})
          </Button>
          <Button
            variant={activeTab === 'graded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('graded')}
            className={activeTab !== 'graded' ? 'border-green-500/50 text-green-600' : ''}
          >
            <CheckCircle className="w-3 h-3 ml-1" />
            مصححة ({gradedOnlyCount})
          </Button>
        </div>

        {/* قائمة الامتحانات */}
        {displayedExams.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {activeTab === 'pending' 
                ? 'لا توجد امتحانات بانتظار التصحيح' 
                : activeTab === 'graded'
                ? 'لا توجد امتحانات مصححة'
                : 'لا توجد امتحانات بجروت متاحة'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onView={() => navigate(`/bagrut-grading/${exam.id}`)}
              />
            ))}
          </div>
        )}

        {/* رابط عرض الكل */}
        {hasMore && (
          <Button
            variant="link"
            className="w-full text-sm text-muted-foreground hover:text-orange-600"
            onClick={() => navigate('/teacher/bagrut-exams')}
          >
            عرض كل الامتحانات ({filteredExams.length})
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BagrutWidget;
