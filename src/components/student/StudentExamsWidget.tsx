import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useStudentExams } from "@/hooks/useStudentExams";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { StudentExamCard } from "./StudentExamCard";
import { Skeleton } from "@/components/ui/skeleton";

export const StudentExamsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: exams, isLoading } = useStudentExams(user?.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            الامتحانات الإلكترونية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // فلترة الامتحانات المتاحة فقط
  const availableExams = exams?.filter(exam => exam.can_start) || [];

  if (availableExams.length === 0) {
    return null; // لا نعرض الـ widget إذا لم توجد امتحانات متاحة
  }

  // أقرب امتحان متاح
  const nextExam = availableExams[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          الامتحانات الإلكترونية
        </CardTitle>
        {availableExams.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-sm"
          >
            عرض الكل ({availableExams.length})
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <StudentExamCard exam={nextExam} />
        {availableExams.length > 1 && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            لديك {availableExams.length - 1} امتحان آخر متاح
          </p>
        )}
      </CardContent>
    </Card>
  );
};
