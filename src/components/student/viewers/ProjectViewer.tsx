import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useStudentAssignedGrade } from '@/hooks/useStudentAssignedGrade';
import Grade10MiniProjectEditor from '@/components/content/Grade10MiniProjectEditor';
import { Trophy, X, CheckCircle, FileText, Target, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectViewerProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    deliverables?: string;
    due_date?: string;
    max_points?: number;
  };
  onProgress: (progress: number, workTime: number) => void;
  onComplete: () => void;
}

export const ProjectViewer: React.FC<ProjectViewerProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onProgress,
  onComplete 
}) => {
  const { assignedGrade } = useStudentAssignedGrade();
  const [workTime, setWorkTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [notes, setNotes] = useState('');
  const [checkedRequirements, setCheckedRequirements] = useState<boolean[]>([]);

  // Parse requirements into checklist
  const requirements = project.requirements 
    ? project.requirements.split('\n').filter(req => req.trim())
    : [];

  useEffect(() => {
    setCheckedRequirements(new Array(requirements.length).fill(false));
  }, [requirements.length]);

  useEffect(() => {
    if (isOpen && !hasStarted) {
      setHasStarted(true);
      toast.info('بدأت العمل على المشروع', {
        description: 'ستحصل على النقاط عند إكمال المتطلبات'
      });
    }
  }, [isOpen, hasStarted]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setWorkTime(prev => {
        const newTime = prev + 1;
        
        // Calculate progress based on work time and checked requirements
        const timeProgress = Math.min((newTime / 300) * 100, 50); // 5 minutes = 50%
        const requirementProgress = requirements.length > 0 
          ? (checkedRequirements.filter(Boolean).length / requirements.length) * 50
          : 50;
        
        const combinedProgress = timeProgress + requirementProgress;
        
        setProgress(combinedProgress);
        onProgress(combinedProgress, newTime);

        // Mark as complete if worked enough time and checked all requirements
        if (combinedProgress >= 90 && !isCompleted) {
          setIsCompleted(true);
          onComplete();
          toast.success('تم إكمال العمل على المشروع بنجاح!', {
            description: 'تم إضافة النقاط إلى رصيدك'
          });
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, checkedRequirements, requirements.length, onProgress, onComplete, isCompleted]);

  const handleClose = () => {
    // Save final progress before closing
    if (progress > 0) {
      onProgress(progress, workTime);
    }
    onClose();
  };

  const toggleRequirement = (index: number) => {
    setCheckedRequirements(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const saveNotes = () => {
    toast.success('تم حفظ الملاحظات', {
      description: 'سيتم حفظ ملاحظاتك مع تقدم المشروع'
    });
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // For Grade 10 students, use the Mini Project Editor
  if (assignedGrade === '10') {
    return (
      <Grade10MiniProjectEditor
        project={project}
        isOpen={isOpen}
        onClose={() => {
          // Save final progress before closing
          if (progress > 0) {
            onProgress(progress, workTime);
          }
          onClose();
        }}
        onSave={() => {
          onComplete?.();
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {project.title}
              </DialogTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {project.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>تاريخ التسليم: {formatDueDate(project.due_date)}</span>
                  </div>
                )}
                {project.max_points && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>النقاط المتاحة: {project.max_points}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  مكتمل
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Details */}
            <div className="space-y-4">
              {/* Requirements Checklist */}
              {requirements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      متطلبات المشروع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {requirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checkedRequirements[index] || false}
                          onChange={() => toggleRequirement(index)}
                          className="mt-1 w-4 h-4 rounded border-2 border-primary text-primary focus:ring-primary"
                        />
                        <span className={`text-sm ${checkedRequirements[index] ? 'line-through text-muted-foreground' : ''}`}>
                          {requirement}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Deliverables */}
              {project.deliverables && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      المخرجات المطلوبة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-sm">
                        {project.deliverables}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Work Area */}
            <div className="space-y-4">
              {/* Notes Area */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">ملاحظات العمل</CardTitle>
                    <Button variant="outline" size="sm" onClick={saveNotes}>
                      <Save className="w-3 h-3 mr-1" />
                      حفظ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="اكتب ملاحظاتك وأفكارك حول المشروع هنا..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                </CardContent>
              </Card>

              {/* Progress Indicators */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">تقدم العمل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">التقدم الإجمالي</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">وقت العمل</span>
                      <div className="font-medium">
                        {Math.floor(workTime / 60)}:{(workTime % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-muted-foreground">المتطلبات</span>
                      <div className="font-medium">
                        {checkedRequirements.filter(Boolean).length}/{requirements.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              إغلاق
            </Button>
            {isCompleted && (
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                مكتمل
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};