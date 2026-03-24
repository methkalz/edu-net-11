import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ModernHeader from '@/components/shared/ModernHeader';
import { useTeacherBagrutStats, BagrutExamForTeacher } from '@/hooks/useTeacherBagrutStats';
import TeacherExamPreviewDialog from '@/components/bagrut/TeacherExamPreviewDialog';
import { useTeacherContentAccess } from '@/hooks/useTeacherContentAccess';
import {
  GraduationCap,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Award,
  TrendingUp,
  Target,
  Search,
  Eye,
  BookOpen,
  Calendar,
  ArrowLeft,
} from 'lucide-react';

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

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  colorClass: string;
  bgClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-transparent backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
    <div className={`absolute inset-0 bg-gradient-to-br ${bgClass} opacity-50`} />
    <CardContent className="p-6 relative">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-xl ${bgClass} backdrop-blur-sm group-hover:scale-110 transition-transform`}>
          <Icon className={`h-7 w-7 ${colorClass}`} />
        </div>
        <div className="space-y-1 w-full">
          <p className="text-sm text-muted-foreground font-medium text-center">{label}</p>
          <p className={`text-3xl font-bold ${colorClass} text-center`}>
            {value}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface ExamCardProps {
  exam: BagrutExamForTeacher;
  onView: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onView }) => {
  const hasPending = exam.pendingGrading > 0;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/60 backdrop-blur-lg overflow-hidden hover:scale-[1.005]">
      <div className="absolute inset-0 bg-gradient-to-l from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* معلومات الامتحان */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold group-hover:text-orange-600 transition-colors">{exam.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{exam.subject}</span>
                <span>•</span>
                <span>{exam.exam_year}</span>
                <span>•</span>
                <span>{seasonLabels[exam.exam_season] || exam.exam_season}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {exam.available_for_grades.map(grade => (
                  <Badge key={grade} variant="secondary" className="text-xs">
                    الصف {grade}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* إحصائيات وأزرار */}
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="font-medium">{exam.studentAttempts}</span>
              <span>محاولة</span>
            </div>
            
            {hasPending && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                <Clock className="h-3.5 w-3.5 ml-1" />
                {exam.pendingGrading} بانتظار
              </Badge>
            )}
            
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{exam.gradedCount}</span>
              <span>مصحح</span>
            </div>
            
            {exam.averageScore !== null && (
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{exam.averageScore}%</span>
              </div>
            )}
            
            <Button 
              variant={hasPending ? "default" : "outline"} 
              size="sm"
              onClick={onView}
              className={hasPending ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Eye className="h-4 w-4 ml-1" />
              {hasPending ? 'تصحيح' : 'عرض'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TeacherBagrutExams: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessGrade, loading: accessLoading } = useTeacherContentAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');

  // تحديد الصفوف المتاحة للمعلم
  const canAccessGrade11 = canAccessGrade('11');
  const canAccessGrade12 = canAccessGrade('12');

  const { data: stats, isLoading, error } = useTeacherBagrutStats({
    canAccessGrade11,
    canAccessGrade12,
  });

  // فلترة وبحث الامتحانات
  const filteredExams = useMemo(() => {
    if (!stats?.examsWithDetails) return [];
    
    let exams = [...stats.examsWithDetails];
    
    // فلترة حسب الحالة
    if (filter === 'pending') {
      exams = exams.filter(e => e.pendingGrading > 0);
    } else if (filter === 'graded') {
      exams = exams.filter(e => e.gradedCount > 0 && e.pendingGrading === 0);
    }
    
    // فلترة حسب البحث
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      exams = exams.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.subject.toLowerCase().includes(query) ||
        e.exam_year.toString().includes(query)
      );
    }
    
    return exams;
  }, [stats?.examsWithDetails, filter, searchQuery]);

  const pendingCount = stats?.examsWithDetails.filter(e => e.pendingGrading > 0).length || 0;
  const gradedOnlyCount = stats?.examsWithDetails.filter(e => e.gradedCount > 0 && e.pendingGrading === 0).length || 0;

  if (!canAccessGrade11 && !canAccessGrade12) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5" dir="rtl">
        <ModernHeader 
          title="امتحانات البجروت"
          showBackButton={true}
          backPath="/dashboard"
        />
        <div className="container mx-auto p-6">
          <Card className="p-12 text-center">
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-bold mb-2">غير متاح</h2>
            <p className="text-muted-foreground">
              امتحانات البجروت متاحة فقط لمعلمي الصفين الحادي عشر والثاني عشر
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5" dir="rtl">
      <ModernHeader 
        title="امتحانات البجروت"
        showBackButton={true}
        backPath="/dashboard"
      />
      
      <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-7 w-7 mx-auto mb-3 rounded-xl" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-12 mx-auto" />
              </Card>
            ))
          ) : (
            <>
              <StatCard
                icon={BookOpen}
                label="الامتحانات المتاحة"
                value={stats?.availableExams || 0}
                colorClass="text-orange-500"
                bgClass="from-orange-500/10 to-orange-600/5"
              />
              <StatCard
                icon={Users}
                label="الطلاب المتقدمين"
                value={stats?.studentsParticipated || 0}
                colorClass="text-blue-500"
                bgClass="from-blue-500/10 to-blue-600/5"
              />
              <StatCard
                icon={FileText}
                label="إجمالي المحاولات"
                value={stats?.totalStudentAttempts || 0}
                colorClass="text-purple-500"
                bgClass="from-purple-500/10 to-purple-600/5"
              />
              <StatCard
                icon={Clock}
                label="بانتظار التصحيح"
                value={stats?.pendingGrading || 0}
                colorClass="text-yellow-600"
                bgClass="from-yellow-500/10 to-yellow-600/5"
              />
              <StatCard
                icon={CheckCircle}
                label="تم التصحيح"
                value={stats?.gradedAttempts || 0}
                colorClass="text-green-500"
                bgClass="from-green-500/10 to-green-600/5"
              />
              <StatCard
                icon={Award}
                label="النتائج المنشورة"
                value={stats?.publishedResults || 0}
                colorClass="text-indigo-500"
                bgClass="from-indigo-500/10 to-indigo-600/5"
              />
              <StatCard
                icon={TrendingUp}
                label="معدل العلامات"
                value={`${stats?.averageScore || 0}%`}
                colorClass="text-emerald-500"
                bgClass="from-emerald-500/10 to-emerald-600/5"
              />
            </>
          )}
        </div>

        {/* قسم الفلترة والبحث */}
        <Card className="p-4 md:p-6 border-0 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* حقل البحث */}
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن امتحان بالاسم أو المادة أو السنة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-12 rounded-xl bg-background"
              />
            </div>
            
            {/* أزرار الفلترة */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="h-12"
              >
                الكل ({stats?.examsWithDetails.length || 0})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                className={`h-12 ${filter !== 'pending' && pendingCount > 0 ? 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50' : ''}`}
              >
                <Clock className="h-4 w-4 ml-1" />
                بانتظار التصحيح ({pendingCount})
              </Button>
              <Button
                variant={filter === 'graded' ? 'default' : 'outline'}
                onClick={() => setFilter('graded')}
                className={`h-12 ${filter !== 'graded' ? 'border-green-500/50 text-green-600 hover:bg-green-50' : ''}`}
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                مصححة ({gradedOnlyCount})
              </Button>
            </div>
          </div>
        </Card>

        {/* قائمة الامتحانات */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              الامتحانات ({filteredExams.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredExams.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد امتحانات</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'لم يتم العثور على نتائج مطابقة للبحث' : 'لا توجد امتحانات بجروت متاحة حالياً'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredExams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onView={() => navigate(`/bagrut-grading/${exam.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* زر العودة للداشبورد */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherBagrutExams;
