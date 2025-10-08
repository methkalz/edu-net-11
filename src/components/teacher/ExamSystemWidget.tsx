import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ClipboardList, 
  BookOpen, 
  FileText, 
  Users, 
  TrendingUp,
  Plus,
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { useTeacherExamStats } from '@/hooks/useTeacherExamStats';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import QuestionBankManager from '@/components/content/QuestionBankManager';
import ExamTemplateManager from '@/components/content/ExamTemplateManager';

const ExamSystemWidget: React.FC = () => {
  const { stats, loading, error } = useTeacherExamStats();
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'بنك الأسئلة',
      value: stats.totalQuestions,
      icon: BookOpen,
      color: 'blue',
      bgClass: 'bg-blue-50 dark:bg-blue-950/20',
      iconClass: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'قوالب الاختبارات',
      value: stats.totalTemplates,
      icon: ClipboardList,
      color: 'purple',
      bgClass: 'bg-purple-50 dark:bg-purple-950/20',
      iconClass: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'الطلاب المشاركون',
      value: stats.studentsAttempted,
      icon: Users,
      color: 'green',
      bgClass: 'bg-green-50 dark:bg-green-950/20',
      iconClass: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'متوسط الدرجات',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'orange',
      bgClass: 'bg-orange-50 dark:bg-orange-950/20',
      iconClass: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'question': return BookOpen;
      case 'template': return ClipboardList;
      case 'exam': return FileText;
      case 'attempt': return Users;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'question': return 'blue';
      case 'template': return 'purple';
      case 'exam': return 'green';
      case 'attempt': return 'orange';
      default: return 'gray';
    }
  };

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
          {/* الإحصائيات السريعة */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((stat, index) => (
                <div
                  key={index}
                  className={`${stat.bgClass} rounded-lg p-4 hover:scale-105 transition-transform duration-200`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-5 w-5 ${stat.iconClass}`} />
                    <Badge variant="secondary" className="text-xs">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                </div>
              ))}
            </div>
          )}

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

          {/* آخر الأنشطة */}
          {!loading && stats.recentActivity.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">آخر الأنشطة</h4>
              </div>
              <div className="space-y-2">
                {stats.recentActivity.slice(0, 3).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const color = getActivityColor(activity.type);
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full bg-${color}-50 dark:bg-${color}-950/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && stats.totalQuestions === 0 && stats.totalTemplates === 0 && (
            <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
              <Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">لم تقم بإنشاء أي محتوى بعد</p>
              <p className="text-xs text-muted-foreground mb-4">ابدأ بإضافة أسئلة أو إنشاء قوالب اختبارات</p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQuestionBank(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة سؤال
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء قالب
                </Button>
              </div>
            </div>
          )}
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
