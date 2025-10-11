import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentExams } from "@/hooks/useStudentExams";
import { useAuth } from "@/hooks/useAuth";
import { StudentExamCard } from "./StudentExamCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { isPast, isFuture } from "date-fns";

export const StudentExamsSection = () => {
  const { user } = useAuth();
  const { data: exams, isLoading } = useStudentExams(user?.id);
  const [activeTab, setActiveTab] = useState("available");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!exams || exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد امتحانات</h3>
        <p className="text-muted-foreground">
          لم يتم جدولة أي امتحانات حالياً
        </p>
      </div>
    );
  }

  // تصنيف الامتحانات
  const availableExams = exams.filter(
    exam => exam.can_start && !isPast(new Date(exam.end_datetime))
  );
  
  const upcomingExams = exams.filter(
    exam => isFuture(new Date(exam.start_datetime))
  );
  
  const completedExams = exams.filter(
    exam => exam.attempts_used >= exam.max_attempts || isPast(new Date(exam.end_datetime))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">الامتحانات الإلكترونية</h2>
        <p className="text-muted-foreground">
          جميع الامتحانات المجدولة والمتاحة لك
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            متاحة ({availableExams.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            قادمة ({upcomingExams.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            مكتملة ({completedExams.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          {availableExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لا توجد امتحانات متاحة حالياً
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableExams.map((exam) => (
                <StudentExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لا توجد امتحانات قادمة
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingExams.map((exam) => (
                <StudentExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لم تكمل أي امتحانات بعد
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedExams.map((exam) => (
                <StudentExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
