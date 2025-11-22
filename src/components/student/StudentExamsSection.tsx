import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentExams } from "@/hooks/useStudentExams";
import { useAuth } from "@/hooks/useAuth";
import { StudentExamCard } from "./StudentExamCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { isPast, isFuture } from "date-fns";
import { cn } from "@/lib/utils";

export const StudentExamsSection = () => {
  const {
    user
  } = useAuth();
  const {
    data: exams,
    isLoading
  } = useStudentExams(user?.id);
  const [activeTab, setActiveTab] = useState("available");
  
  // State للتنبيه البصري
  const [highlightAvailable, setHighlightAvailable] = useState(false);
  const previousAvailableCountRef = useRef(0);
  if (isLoading) {
    return <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>;
  }
  if (!exams || exams.length === 0) {
    return <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد امتحانات</h3>
        <p className="text-muted-foreground">
          لم يتم جدولة أي امتحانات حالياً
        </p>
      </div>;
  }

  // تصنيف الامتحانات
  const now = new Date();
  const availableExams = exams.filter(exam => exam.can_start && !isPast(new Date(exam.end_datetime)) && !isFuture(new Date(exam.start_datetime)));
  const upcomingExams = exams.filter(exam => isFuture(new Date(exam.start_datetime)) && exam.attempts_remaining > 0);
  const completedExams = exams.filter(exam => exam.attempts_used >= exam.max_attempts || isPast(new Date(exam.end_datetime)));

  // مراقبة التغييرات في عدد الامتحانات المتاحة للتنبيه البصري
  useEffect(() => {
    const currentCount = availableExams.length;
    const previousCount = previousAvailableCountRef.current;
    
    console.log('🔍 Available exams count changed:', {
      current: currentCount,
      previous: previousCount,
      shouldHighlight: currentCount > previousCount && previousCount > 0
    });
    
    // عند زيادة عدد الامتحانات المتاحة (امتحان جديد أصبح متاحاً)
    if (currentCount > previousCount && previousCount > 0) {
      console.log('✅ Triggering green pulse animation!');
      // تفعيل التأثير البصري (3 ومضات خضراء)
      setHighlightAvailable(true);
      
      // إيقاف التأثير بعد 2 ثانية (3 ومضات × ~600ms)
      setTimeout(() => {
        setHighlightAvailable(false);
        console.log('⏹️ Green pulse animation ended');
      }, 2000);
    }
    
    // تحديث العدد السابق (لا يسبب re-render)
    previousAvailableCountRef.current = currentCount;
  }, [availableExams.length]);
  return <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-center mx-0 px-0 my-[4px] py-[2px]">الامتحانات الإلكترونية</h2>
        <p className="text-muted-foreground text-center">
          جميع الامتحانات المجدولة والمتاحة لك
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] lg:mx-auto">
          <TabsTrigger 
            value="available" 
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              highlightAvailable && "animate-pulse-green"
            )}
          >
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
          {availableExams.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لا توجد امتحانات متاحة حالياً
              </p>
            </div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableExams.map(exam => <StudentExamCard key={exam.id} exam={exam} />)}
            </div>}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingExams.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لا توجد امتحانات قادمة
              </p>
            </div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingExams.map(exam => <StudentExamCard key={exam.id} exam={exam} />)}
            </div>}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedExams.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لم تكمل أي امتحانات بعد
              </p>
            </div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedExams.map(exam => <StudentExamCard key={exam.id} exam={exam} />)}
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
};