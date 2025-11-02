import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Trophy, Calendar, AlertCircle } from "lucide-react";
import { AvailableExam } from "@/types/exam";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isPast, isFuture } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { StudentExamResultsDialog } from "./StudentExamResultsDialog";
import { useAuth } from "@/hooks/useAuth";

interface StudentExamCardProps {
  exam: AvailableExam;
}

export const StudentExamCard = ({ exam }: StudentExamCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showResults, setShowResults] = useState(false);

  const getExamStatus = () => {
    if (exam.can_start && !isPast(new Date(exam.end_datetime))) {
      return { label: "متاح الآن", variant: "default" as const, color: "text-primary" };
    }
    if (exam.attempts_used >= exam.max_attempts) {
      return { label: "مكتمل", variant: "secondary" as const, color: "text-muted-foreground" };
    }
    if (isPast(new Date(exam.end_datetime))) {
      return { label: "منتهي", variant: "destructive" as const, color: "text-destructive" };
    }
    if (isFuture(new Date(exam.start_datetime))) {
      return { label: "قريباً", variant: "outline" as const, color: "text-accent-foreground" };
    }
    return { label: "غير متاح", variant: "outline" as const, color: "text-muted-foreground" };
  };

  const status = getExamStatus();

  const handleStartExam = () => {
    navigate(`/student/exam/${exam.id}`);
  };

  const handleViewResults = () => {
    setShowResults(true);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{exam.title}</CardTitle>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>
        {exam.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {exam.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* معلومات الامتحان */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{exam.total_questions} سؤال</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span>{exam.total_points} علامة</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{exam.duration_minutes} دقيقة</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span>
              {exam.attempts_used}/{exam.max_attempts} محاولة
            </span>
          </div>
        </div>

        {/* الوقت */}
        <div className="space-y-1 text-sm">
          {exam.can_start && !isPast(new Date(exam.end_datetime)) && (
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="h-4 w-4" />
              <span>
                ينتهي {formatDistanceToNow(new Date(exam.end_datetime), { 
                  addSuffix: true, 
                  locale: ar 
                })}
              </span>
            </div>
          )}
          {isFuture(new Date(exam.start_datetime)) && (
            <div className="flex items-center gap-2 text-accent-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                يبدأ {formatDistanceToNow(new Date(exam.start_datetime), { 
                  addSuffix: true, 
                  locale: ar 
                })}
              </span>
            </div>
          )}
        </div>

        {/* الأزرار */}
        <div className="flex gap-2">
          {exam.can_start && !isPast(new Date(exam.end_datetime)) ? (
            <Button 
              onClick={handleStartExam} 
              className="w-full"
              size="sm"
            >
              ابدأ الامتحان
            </Button>
          ) : exam.attempts_used > 0 ? (
            <Button 
              onClick={handleViewResults} 
              variant="outline" 
              className="w-full"
              size="sm"
              disabled
            >
              عرض النتائج
            </Button>
          ) : (
            <Button disabled className="w-full" size="sm">
              {status.label}
            </Button>
          )}
        </div>
      </CardContent>

      {/* نافذة عرض النتائج */}
      {user && (
        <StudentExamResultsDialog
          open={showResults}
          onOpenChange={setShowResults}
          examId={exam.id}
          studentUserId={user.id}
        />
      )}
    </Card>
  );
};
