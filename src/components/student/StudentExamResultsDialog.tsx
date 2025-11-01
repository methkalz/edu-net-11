import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, FileText, Trophy, AlertCircle } from "lucide-react";
import { useStudentExamAttempts } from "@/hooks/useStudentExamAttempts";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface StudentExamResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  studentUserId: string;
}

export const StudentExamResultsDialog = ({
  open,
  onOpenChange,
  examId,
  studentUserId,
}: StudentExamResultsDialogProps) => {
  const { data, isLoading } = useStudentExamAttempts(examId, studentUserId);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    if (minutes > 0) {
      return `${minutes}د ${secs}ث`;
    }
    return `${secs}ث`;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data || !data.attempts.length) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>نتائج الامتحان</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            لا توجد محاولات مكتملة لهذا الامتحان
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const { attempts, examInfo } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{examInfo.title}</DialogTitle>
        </DialogHeader>

        {/* معلومات عامة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">الأسئلة</p>
                <p className="text-lg font-semibold">{examInfo.total_questions}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">علامة النجاح</p>
                <p className="text-lg font-semibold">{examInfo.passing_percentage}%</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">المحاولات</p>
                <p className="text-lg font-semibold">
                  {examInfo.attempts_used}/{examInfo.max_attempts}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">المتبقية</p>
                <p className="text-lg font-semibold">{examInfo.attempts_remaining}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* جدول المحاولات */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">المحاولة</TableHead>
                <TableHead className="text-right">العلامة</TableHead>
                <TableHead className="text-right">النسبة</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    #{attempt.attempt_number}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {attempt.score}/{attempt.total_points}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={attempt.passed ? "default" : "destructive"}
                      className="font-semibold"
                    >
                      {attempt.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {attempt.passed ? (
                      <div className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">نجح</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">رسب</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTime(attempt.time_spent_seconds)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(attempt.submitted_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
