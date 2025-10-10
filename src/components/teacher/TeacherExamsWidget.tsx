import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Clock, Users, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { useTeacherExams } from '@/hooks/useTeacherExams';
import { useAuth } from '@/hooks/useAuth';
import { TeacherExamForm } from './TeacherExamForm';

interface TeacherExamsWidgetProps {
  gradeLevel: '10' | '11';
}

export const TeacherExamsWidget: React.FC<TeacherExamsWidgetProps> = ({ gradeLevel }) => {
  const { userProfile } = useAuth();
  const { exams, loading, fetchExams, deleteExam, publishExam } = useTeacherExams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  useEffect(() => {
    if (userProfile?.role === 'teacher') {
      fetchExams(gradeLevel);
    }
  }, [userProfile, gradeLevel, fetchExams]);

  const handleCreateExam = () => {
    setEditingExam(null);
    setIsFormOpen(true);
  };

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    setIsFormOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'published': return 'منشور';
      case 'closed': return 'مغلق';
      case 'archived': return 'مؤرشف';
      default: return status;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          الاختبارات الإلكترونية - الصف {gradeLevel === '10' ? 'العاشر' : 'الحادي عشر'}
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateExam} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              إنشاء اختبار جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExam ? 'تعديل الاختبار' : 'إنشاء اختبار جديد'}
              </DialogTitle>
            </DialogHeader>
            <TeacherExamForm
              exam={editingExam}
              gradeLevel={gradeLevel}
              onClose={() => setIsFormOpen(false)}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchExams(gradeLevel);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد اختبارات بعد</p>
            <p className="text-sm">ابدأ بإنشاء اختبار جديد للطلاب</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{exam.title}</h3>
                      <Badge className={getStatusColor(exam.status)}>
                        {getStatusLabel(exam.status)}
                      </Badge>
                    </div>
                    {exam.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {exam.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {exam.total_questions} سؤال
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exam.duration_minutes} دقيقة
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {exam.target_class_ids?.length || 0} صف
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExam(exam)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {exam.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => publishExam(exam.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExam(exam.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
