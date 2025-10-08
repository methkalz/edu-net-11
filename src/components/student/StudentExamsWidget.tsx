import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentExams } from '@/hooks/useStudentExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Timer,
  Play,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface ExamCardProps {
  exam: any;
  type: 'active' | 'upcoming' | 'expired';
  timeRemaining?: number;
  onStartExam?: (templateId: string, instanceId: string) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, type, timeRemaining, onStartExam }) => {
  const [countdown, setCountdown] = useState(timeRemaining || 0);

  useEffect(() => {
    if (type === 'active' && timeRemaining) {
      setCountdown(timeRemaining);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 60000); // تحديث كل دقيقة

      return () => clearInterval(interval);
    }
  }, [type, timeRemaining]);

  const formatCountdown = (minutes: number): string => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours} ساعة${mins > 0 ? ` و ${mins} دقيقة` : ''}`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} يوم${remainingHours > 0 ? ` و ${remainingHours} ساعة` : ''}`;
  };

  // بطاقة امتحان جاري
  if (type === 'active') {
    return (
      <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50/50 via-background to-orange-50/30 dark:from-red-950/20 dark:via-background dark:to-orange-950/10 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <Badge variant="destructive" className="text-xs">جاري الآن</Badge>
              </div>
              <h4 className="font-semibold text-base line-clamp-2">{exam.exam_templates.title}</h4>
              {exam.exam_templates.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {exam.exam_templates.description}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{exam.exam_templates.total_questions} سؤال</span>
              <span className="text-muted-foreground/50">•</span>
              <Clock className="w-4 h-4" />
              <span>{exam.exam_templates.duration_minutes} دقيقة</span>
            </div>
            
            {exam.last_attempt_start_time && countdown > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                <Timer className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  ينتهي بعد: {formatCountdown(countdown)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>متبقي {exam.max_attempts} محاولة</span>
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold"
            size="sm"
            onClick={() => {
              if (exam.max_attempts === 0) {
                toast.error('لقد استنفذت جميع المحاولات المتاحة لهذا الامتحان');
                return;
              }
              onStartExam?.(exam.exam_templates.id, exam.id);
            }}
          >
            <Play className="w-4 h-4 ml-2" />
            ابدأ الامتحان الآن
          </Button>
        </CardContent>
      </Card>
    );
  }

  // بطاقة امتحان قادم
  if (type === 'upcoming') {
    const startsAt = new Date(exam.starts_at);
    
    return (
      <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50/50 via-background to-amber-50/30 dark:from-yellow-950/20 dark:via-background dark:to-amber-950/10 hover:shadow-md transition-all duration-300">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  قادم
                </Badge>
              </div>
              <h4 className="font-semibold text-base line-clamp-2">{exam.exam_templates.title}</h4>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100/80 dark:bg-yellow-950/30">
              <Calendar className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                يبدأ: {format(startsAt, "d.M.yyyy 'الساعة' HH:mm", { locale: ar })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{exam.exam_templates.total_questions} سؤال</span>
              <span className="text-muted-foreground/50">•</span>
              <Clock className="w-4 h-4" />
              <span>{exam.exam_templates.duration_minutes} دقيقة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // بطاقة امتحان منتهي
  return (
    <Card className="border-l-4 border-l-muted bg-muted/30 hover:shadow-sm transition-all duration-300 opacity-75">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">منتهي</Badge>
            </div>
            <h4 className="font-semibold text-sm line-clamp-2 text-muted-foreground">
              {exam.exam_templates.title}
            </h4>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{ message: string; icon: React.ReactNode }> = ({ message, icon }) => (
  <div className="text-center py-8 px-4">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export const StudentExamsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { exams, loading, categorizeExams, getTimeRemaining } = useStudentExams();
  const [categorized, setCategorized] = useState({ active: [], upcoming: [], expired: [] });

  useEffect(() => {
    if (exams.length > 0) {
      setCategorized(categorizeExams());
    }
  }, [exams]);

  // تحديث تلقائي كل دقيقة
  useEffect(() => {
    const interval = setInterval(() => {
      if (exams.length > 0) {
        setCategorized(categorizeExams());
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [exams]);

  const handleStartExam = (templateId: string, instanceId: string) => {
    navigate(`/exam/start/${templateId}?instance=${instanceId}`);
  };

  if (loading) {
    return (
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              الامتحانات الإلكترونية
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyExams = categorized.active.length > 0 || categorized.upcoming.length > 0 || categorized.expired.length > 0;

  return (
    <Card className="border-border/40 bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/30 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/10 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            الامتحانات الإلكترونية
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyExams ? (
          <EmptyState 
            message="لا توجد امتحانات متاحة حالياً"
            icon={<CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />}
          />
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {/* الامتحانات الجارية */}
            {categorized.active.map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                type="active"
                timeRemaining={exam.last_attempt_start_time ? getTimeRemaining(exam.last_attempt_start_time) : undefined}
                onStartExam={handleStartExam}
              />
            ))}

            {/* الامتحانات القادمة */}
            {categorized.upcoming.map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                type="upcoming"
              />
            ))}

            {/* الامتحانات المنتهية - نعرض فقط 2 */}
            {categorized.expired.slice(0, 2).map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                type="expired"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
