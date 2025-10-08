import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ClipboardList, 
  BookOpen, 
  Plus,
  Award
} from 'lucide-react';
import QuestionBankManager from '@/components/content/QuestionBankManager';
import ExamTemplateManager from '@/components/content/ExamTemplateManager';

const ExamSystemWidget: React.FC = () => {
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);


  return (
    <>
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">الاختبارات الإلكترونية</CardTitle>
                <CardDescription>إدارة الأسئلة والامتحانات</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* أزرار الإجراءات السريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => setShowQuestionBank(true)}
              className="justify-start h-auto py-3 px-4"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-medium text-sm">بنك الأسئلة</p>
                  <p className="text-xs text-muted-foreground">إدارة وإضافة الأسئلة</p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setShowTemplates(true)}
              className="justify-start h-auto py-3 px-4"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-medium text-sm">قوالب الاختبارات</p>
                  <p className="text-xs text-muted-foreground">إنشاء وتعديل القوالب</p>
                </div>
              </div>
            </Button>
          </div>


        </CardContent>
      </Card>

      {/* Dialog لبنك الأسئلة */}
      <Dialog open={showQuestionBank} onOpenChange={setShowQuestionBank}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>بنك الأسئلة</DialogTitle>
          </DialogHeader>
          <QuestionBankManager teacherMode={true} />
        </DialogContent>
      </Dialog>

      {/* Dialog لقوالب الاختبارات */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>قوالب الاختبارات</DialogTitle>
          </DialogHeader>
          <ExamTemplateManager teacherMode={true} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExamSystemWidget;
